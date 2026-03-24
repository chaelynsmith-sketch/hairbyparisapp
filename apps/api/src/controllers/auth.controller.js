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
    referralCode: crypto.randomBytes(4).toString("hex").toUpperCase()
  });

  const auth = buildAuthResponse(user);
  user.refreshTokens.push({
    token: auth.refreshToken,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });
  await user.save();

  res.status(201).json(auth);
}

async function login(req, res) {
  const user = await findUserByIdentifier(req.body.identifier);

  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
    throw new ApiError(401, "Invalid email, phone, username, or password");
  }

  const auth = buildAuthResponse(user);
  user.refreshTokens.push({
    token: auth.refreshToken,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });
  await user.save();

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
  login,
  refresh,
  me,
  requestPasswordOtp,
  resetPassword,
  requestUsernameOtp,
  recoverUsername
};
