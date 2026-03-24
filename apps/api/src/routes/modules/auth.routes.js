const express = require("express");
const {
  register,
  login,
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
  loginValidator,
  requestPasswordOtpValidator,
  resetPasswordValidator,
  requestUsernameOtpValidator,
  recoverUsernameValidator
} = require("../../validators/auth.validator");

const authRouter = express.Router();

authRouter.post("/register", registerValidator, validateRequest, asyncHandler(register));
authRouter.post("/login", loginValidator, validateRequest, asyncHandler(login));
authRouter.post("/password/request-otp", requestPasswordOtpValidator, validateRequest, asyncHandler(requestPasswordOtp));
authRouter.post("/password/reset", resetPasswordValidator, validateRequest, asyncHandler(resetPassword));
authRouter.post("/username/request-otp", requestUsernameOtpValidator, validateRequest, asyncHandler(requestUsernameOtp));
authRouter.post("/username/recover", recoverUsernameValidator, validateRequest, asyncHandler(recoverUsername));
authRouter.post("/refresh", asyncHandler(refresh));
authRouter.get("/me", authenticate, asyncHandler(me));

module.exports = { authRouter };
