const { body } = require("express-validator");

const passwordRule = body("password")
  .isLength({ min: 14 })
  .withMessage("Password must be at least 14 characters")
  .matches(/[A-Za-z]/)
  .withMessage("Password must include a letter")
  .matches(/[0-9]/)
  .withMessage("Password must include a number")
  .matches(/[^A-Za-z0-9]/)
  .withMessage("Password must include a special character");

const registerValidator = [
  body().custom((value) => {
    if (!value.email || !value.phone) {
      throw new Error("Email and phone number are both required");
    }

    return true;
  }),
  body("email").isEmail(),
  body("phone").matches(/^\+?[0-9]{10,15}$/),
  body("username").isLength({ min: 4 }).matches(/^[a-zA-Z0-9._-]+$/),
  passwordRule,
  body("firstName").isLength({ min: 2 }),
  body("lastName").isLength({ min: 2 })
];

const otpValidator = body("otp").isLength({ min: 6, max: 6 }).isNumeric();
const loginValidator = [body("identifier").isLength({ min: 3 }), body("password").isLength({ min: 14 })];
const verifyRegistrationValidator = [body("userId").isMongoId(), body("emailOtp").isLength({ min: 6, max: 6 }).isNumeric(), body("phoneOtp").isLength({ min: 6, max: 6 }).isNumeric()];
const resendRegistrationOtpValidator = [body("userId").isMongoId()];
const requestLoginOtpValidator = [body("identifier").isLength({ min: 3 }), body("channel").optional().isIn(["email", "phone"])];
const verifyLoginOtpValidator = [body("identifier").isLength({ min: 3 }), otpValidator];

const requestPasswordOtpValidator = [body("identifier").isLength({ min: 3 })];

const resetPasswordValidator = [
  body("identifier").isLength({ min: 3 }),
  body("otp").isLength({ min: 6, max: 6 }).isNumeric(),
  body("newPassword")
    .isLength({ min: 14 })
    .withMessage("Password must be at least 14 characters")
    .matches(/[A-Za-z]/)
    .withMessage("Password must include a letter")
    .matches(/[0-9]/)
    .withMessage("Password must include a number")
    .matches(/[^A-Za-z0-9]/)
    .withMessage("Password must include a special character")
];

const requestUsernameOtpValidator = [
  body("destination").isLength({ min: 3 }),
  body("destinationType").isIn(["email", "phone"])
];

const recoverUsernameValidator = [
  body("destination").isLength({ min: 3 }),
  body("destinationType").isIn(["email", "phone"]),
  body("otp").isLength({ min: 6, max: 6 }).isNumeric()
];

module.exports = {
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
};
