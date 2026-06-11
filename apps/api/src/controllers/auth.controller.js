const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { User } = require("../models/user.model");
const { Store } = require("../models/store.model");
const { generateOtp, hashOtp, sendOtp } = require("../services/otp.service");
const { signAccessToken, signRefreshToken } = require("../services/token.service");
const { ApiError } = require("../utils/api-error");

function normalizeEmail(email) {
  return email ? email.toLowerCase().trim() : undefined;
}

function normalizePhone(phone) {
  return phone ? phone.replace(/[^\d+]/g, "") : undefined;
}

function normalizeUsername(username) {
  return username ? username.toLowerCase().trim() : undefined;
}

async function findUserByIdentifier(identifier) {
  const normalizedEmail = normalizeEmail(identifier);
  const normalizedPhone = normalizePhone(identifier);
  const normalizedUsername = normalizeUsername(identifier);

  return User.findOne({
    $or: [{ email: normalizedEmail }, { phone: normalizedPhone }, { username: normalizedUsername }]
  });
}

function buildAuthResponse(user) {
  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      storeId: user.storeId,
      preferredLanguage: user.preferredLanguage,
      country: user.country,
      currency: user.currency,
      loyaltyPoints: user.loyaltyPoints
    },
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user)
  };
}

function isActivated(user) {
  return Boolean(user.verification?.emailVerified && user.verification?.phoneVerified && user.verification?.activatedAt);
}

async function sendAccountVerificationOtps(user) {
  const emailCode = generateOtp();
  const phoneCode = generateOtp();

  user.recoveryOtps = (user.recoveryOtps || []).filter(
    (entry) => !["email_verification", "phone_verification"].includes(entry.purpose)
  );
  user.recoveryOtps.push(
    {
      purpose: "email_verification",
      codeHash: hashOtp(emailCode),
      destination: user.email,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    },
    {
      purpose: "phone_verification",
      codeHash: hashOtp(phoneCode),
      destination: user.phone,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    }
  );
  await user.save();

  const [emailDelivery, phoneDelivery] = await Promise.all([
    sendOtp({ destination: user.email, purpose: "email_verification", code: emailCode }),
    sendOtp({ destination: user.phone, purpose: "phone_verification", code: phoneCode })
  ]);

  return {
    email: {
      destination: user.email,
      deliveryChannel: emailDelivery.channel,
      deliveryFallback: !emailDelivery.delivered,
      otpPreview: emailDelivery.delivered ? undefined : emailDelivery.otp
    },
    phone: {
      destination: user.phone,
      deliveryChannel: phoneDelivery.channel,
      deliveryFallback: !phoneDelivery.delivered,
      otpPreview: phoneDelivery.delivered ? undefined : phoneDelivery.otp
    },
    expiresInMinutes: 10
  };
}

async function persistRefreshToken(user, refreshToken) {
  user.refreshTokens.push({
    token: refreshToken,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });
  await user.save();
}

async function register(req, res) {
  const email = normalizeEmail(req.body.email);
  const phone = normalizePhone(req.body.phone);
  const username = normalizeUsername(req.body.username);

  const existingUser = await User.findOne({
    $or: [{ email }, { phone }, { username }].filter((entry) => Object.values(entry)[0])
  });

  if (existingUser) {
    throw new ApiError(409, "Email, phone, or username already registered");
  }

  const store =
    (req.body.storeId && (await Store.findById(req.body.storeId))) ||
    (await Store.findOne({ slug: req.body.storeSlug })) ||
    (await Store.findOne());

  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const user = await User.create({
    storeId: store?.id,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    username,
    email,
    phone,
    passwordHash,
    preferredLanguage: req.body.preferredLanguage || "en",
    country: req.body.country || store?.country || "ZA",
    currency: req.body.currency || store?.defaultCurrency || "ZAR",
    referralCode: crypto.randomBytes(4).toString("hex").toUpperCase(),
    verification: {
      emailVerified: false,
      phoneVerified: false
    }
  });

  const verification = await sendAccountVerificationOtps(user);

  res.status(201).json({
    message: "Account created. Verify both email and phone OTPs to activate your Hair By Paris account.",
    userId: user.id,
    verification
  });
}

async function verifyRegistration(req, res) {
  const user = await User.findById(req.body.userId);

  if (!user) {
    throw new ApiError(404, "Account not found");
  }

  const now = new Date();
  const emailHash = hashOtp(req.body.emailOtp);
  const phoneHash = hashOtp(req.body.phoneOtp);
  const emailOtp = (user.recoveryOtps || []).find(
    (entry) =>
      entry.purpose === "email_verification" &&
      entry.destination === user.email &&
      entry.codeHash === emailHash &&
      entry.expiresAt > now
  );
  const phoneOtp = (user.recoveryOtps || []).find(
    (entry) =>
      entry.purpose === "phone_verification" &&
      entry.destination === user.phone &&
      entry.codeHash === phoneHash &&
      entry.expiresAt > now
  );

  if (!emailOtp || !phoneOtp) {
    throw new ApiError(401, "Both email and phone OTPs must be valid before activation");
  }

  user.verification = {
    emailVerified: true,
    phoneVerified: true,
    activatedAt: new Date()
  };
  user.recoveryOtps = (user.recoveryOtps || []).filter(
    (entry) => !["email_verification", "phone_verification"].includes(entry.purpose)
  );

  const auth = buildAuthResponse(user);
  await persistRefreshToken(user, auth.refreshToken);

  res.json(auth);
}

async function resendRegistrationOtp(req, res) {
  const user = await User.findById(req.body.userId);

  if (!user) {
    throw new ApiError(404, "Account not found");
  }

  if (isActivated(user)) {
    throw new ApiError(409, "Account is already verified");
  }

  const verification = await sendAccountVerificationOtps(user);
  res.json({ message: "Verification OTPs resent", verification });
}

async function login(req, res) {
  const user = await findUserByIdentifier(req.body.identifier);

  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
    throw new ApiError(401, "Invalid email, phone, username, or password");
  }

  if (!isActivated(user)) {
    throw new ApiError(403, "Verify both email and phone OTPs before signing in");
  }

  const auth = buildAuthResponse(user);
  await persistRefreshToken(user, auth.refreshToken);

  res.json(auth);
}

async function requestLoginOtp(req, res) {
  const user = await findUserByIdentifier(req.body.identifier);

  if (!user || !isActivated(user)) {
    throw new ApiError(404, "Verified account not found");
  }

  const destination = req.body.channel === "email" ? user.email : user.phone;
  const code = generateOtp();
  user.recoveryOtps = (user.recoveryOtps || []).filter((entry) => entry.purpose !== "login");
  user.recoveryOtps.push({
    purpose: "login",
    codeHash: hashOtp(code),
    destination,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000)
  });
  await user.save();

  const delivery = await sendOtp({ destination, purpose: "login", code });
  res.json({
    message: `Login OTP sent to ${destination}`,
    destination,
    expiresInMinutes: 10,
    deliveryChannel: delivery.channel,
    deliveryFallback: !delivery.delivered,
    otpPreview: delivery.delivered ? undefined : delivery.otp
  });
}

async function verifyLoginOtp(req, res) {
  const user = await findUserByIdentifier(req.body.identifier);

  if (!user || !isActivated(user)) {
    throw new ApiError(404, "Verified account not found");
  }

  const otpHash = hashOtp(req.body.otp);
  const otpRecord = (user.recoveryOtps || []).find(
    (entry) => entry.purpose === "login" && entry.codeHash === otpHash && entry.expiresAt > new Date()
  );

  if (!otpRecord) {
    throw new ApiError(401, "Invalid or expired login OTP");
  }

  user.recoveryOtps = (user.recoveryOtps || []).filter((entry) => entry.purpose !== "login");
  const auth = buildAuthResponse(user);
  await persistRefreshToken(user, auth.refreshToken);

  res.json(auth);
}

async function refresh(req, res) {
  const token = req.body.refreshToken;
  const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(payload.sub);

  if (!user || !user.refreshTokens.some((entry) => entry.token === token)) {
    throw new ApiError(401, "Invalid refresh token");
  }

  res.json(buildAuthResponse(user));
}

async function me(req, res) {
  res.json({ user: req.user });
}

async function requestPasswordOtp(req, res) {
  const user = await findUserByIdentifier(req.body.identifier);

  if (!user) {
    throw new ApiError(404, "Account not found");
  }

  const destination = user.email || user.phone;
  const code = generateOtp();

  user.recoveryOtps = (user.recoveryOtps || []).filter((entry) => entry.purpose !== "password_reset");
  user.recoveryOtps.push({
    purpose: "password_reset",
    codeHash: hashOtp(code),
    destination,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000)
  });
  await user.save();

  const delivery = await sendOtp({ destination, purpose: "password_reset", code });

  res.json({
    message: `OTP sent to ${destination}`,
    destination,
    expiresInMinutes: 10,
    otpPreview: delivery.delivered ? undefined : delivery.otp,
    deliveryChannel: delivery.channel,
    deliveryFallback: !delivery.delivered
  });
}

async function resetPassword(req, res) {
  const user = await findUserByIdentifier(req.body.identifier);

  if (!user) {
    throw new ApiError(404, "Account not found");
  }

  const otpHash = hashOtp(req.body.otp);
  const otpRecord = (user.recoveryOtps || []).find(
    (entry) => entry.purpose === "password_reset" && entry.codeHash === otpHash && entry.expiresAt > new Date()
  );

  if (!otpRecord) {
    throw new ApiError(401, "Invalid or expired OTP");
  }

  user.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
  user.recoveryOtps = (user.recoveryOtps || []).filter((entry) => entry.purpose !== "password_reset");
  user.refreshTokens = [];
  await user.save();

  res.json({ message: "Password updated successfully" });
}

async function changePassword(req, res) {
  const user = await User.findById(req.user.id);

  if (!user || !(await bcrypt.compare(req.body.currentPassword, user.passwordHash))) {
    throw new ApiError(401, "Current password is incorrect");
  }

  user.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
  user.refreshTokens = [];
  await user.save();

  res.json({ message: "Password changed successfully. Please sign in again." });
}

async function requestUsernameOtp(req, res) {
  const destination =
    req.body.destinationType === "email"
      ? normalizeEmail(req.body.destination)
      : normalizePhone(req.body.destination);

  const user = await User.findOne({ [req.body.destinationType]: destination });

  if (!user) {
    throw new ApiError(404, "Account not found");
  }

  const code = generateOtp();
  user.recoveryOtps = (user.recoveryOtps || []).filter((entry) => entry.purpose !== "username_recovery");
  user.recoveryOtps.push({
    purpose: "username_recovery",
    codeHash: hashOtp(code),
    destination,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000)
  });
  await user.save();

  const delivery = await sendOtp({ destination, purpose: "username_recovery", code });

  res.json({
    message: `OTP sent to ${destination}`,
    destination,
    expiresInMinutes: 10,
    otpPreview: delivery.delivered ? undefined : delivery.otp,
    deliveryChannel: delivery.channel,
    deliveryFallback: !delivery.delivered
  });
}

async function recoverUsername(req, res) {
  const destination =
    req.body.destinationType === "email"
      ? normalizeEmail(req.body.destination)
      : normalizePhone(req.body.destination);

  const user = await User.findOne({ [req.body.destinationType]: destination });

  if (!user) {
    throw new ApiError(404, "Account not found");
  }

  const otpHash = hashOtp(req.body.otp);
  const otpRecord = (user.recoveryOtps || []).find(
    (entry) => entry.purpose === "username_recovery" && entry.destination === destination && entry.codeHash === otpHash && entry.expiresAt > new Date()
  );

  if (!otpRecord) {
    throw new ApiError(401, "Invalid or expired OTP");
  }

  user.recoveryOtps = (user.recoveryOtps || []).filter((entry) => entry.purpose !== "username_recovery");
  await user.save();

  res.json({ username: user.username, message: "Username recovered successfully" });
}

module.exports = {
  register,
  verifyRegistration,
  resendRegistrationOtp,
  login,
  requestLoginOtp,
  verifyLoginOtp,
  refresh,
  me,
  requestPasswordOtp,
  resetPassword,
  changePassword,
  requestUsernameOtp,
  recoverUsername
};
