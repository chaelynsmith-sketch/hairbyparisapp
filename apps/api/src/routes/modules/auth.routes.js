const express = require("express");
const rateLimit = require("express-rate-limit");
const {
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
  requestUsernameOtp,
  recoverUsername
} = require("../../controllers/auth.controller");
const { authenticate } = require("../../middleware/auth.middleware");
const { validateRequest } = require("../../middleware/validate.middleware");
const { asyncHandler } = require("../../utils/async-handler");
const {
  registerValidator,
  verifyRegistrationValidator,
  resendRegistrationOtpValidator,
  loginValidator,
  requestLoginOtpValidator,
  verifyLoginOtpValidator,
  requestPasswordOtpValidator,
  resetPasswordValidator,
  requestUsernameOtpValidator,
  recoverUsernameValidator
} = require("../../validators/auth.validator");

const authRouter = express.Router();
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many OTP attempts. Please wait before trying again." }
});

authRouter.post("/register", otpLimiter, registerValidator, validateRequest, asyncHandler(register));
authRouter.post("/register/verify", otpLimiter, verifyRegistrationValidator, validateRequest, asyncHandler(verifyRegistration));
authRouter.post("/register/resend-otp", otpLimiter, resendRegistrationOtpValidator, validateRequest, asyncHandler(resendRegistrationOtp));
authRouter.post("/login", loginValidator, validateRequest, asyncHandler(login));
authRouter.post("/login/request-otp", otpLimiter, requestLoginOtpValidator, validateRequest, asyncHandler(requestLoginOtp));
authRouter.post("/login/verify-otp", otpLimiter, verifyLoginOtpValidator, validateRequest, asyncHandler(verifyLoginOtp));
authRouter.post("/password/request-otp", otpLimiter, requestPasswordOtpValidator, validateRequest, asyncHandler(requestPasswordOtp));
authRouter.post("/password/reset", otpLimiter, resetPasswordValidator, validateRequest, asyncHandler(resetPassword));
authRouter.post("/username/request-otp", otpLimiter, requestUsernameOtpValidator, validateRequest, asyncHandler(requestUsernameOtp));
authRouter.post("/username/recover", otpLimiter, recoverUsernameValidator, validateRequest, asyncHandler(recoverUsername));
authRouter.post("/refresh", asyncHandler(refresh));
authRouter.get("/me", authenticate, asyncHandler(me));

module.exports = { authRouter };
