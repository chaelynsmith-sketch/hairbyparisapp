const { body, query } = require("express-validator");

const paymentProviders = ["stripe", "paypal", "payfast", "ozow"];

const createOrderValidator = [
  body("paymentProvider").trim().isIn(paymentProviders),
  body("paymentMethodType").optional().trim().isIn(["card", "google_pay", "paypal", "payfast", "ozow"]),
  body("forceDuplicate").optional().isBoolean(),
  body("couponCode").optional().trim().isString(),
  body("shippingAddress").optional().isObject(),
  body("shippingAddress.country").optional().trim().isLength({ min: 2, max: 2 })
];

const checkoutSummaryValidator = [query("couponCode").optional().trim().isString()];

const adminUpdateOrderValidator = [
  body("supplierDispatchStatus")
    .optional()
    .trim()
    .isIn(["queued", "manual_review", "dispatched", "manual_action_required"]),
  body("trackingNumber").optional().trim().isString(),
  body("trackingUrl").optional({ values: "falsy" }).trim().isURL(),
  body("status").optional().trim().isIn(["pending", "paid", "processing", "shipped", "delivered", "cancelled"])
];

module.exports = { createOrderValidator, checkoutSummaryValidator, adminUpdateOrderValidator, paymentProviders };
