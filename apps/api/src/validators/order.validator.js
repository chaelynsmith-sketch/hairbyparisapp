const { body, query } = require("express-validator");

const paymentProviders = ["payfast"];

const createOrderValidator = [
  body("paymentProvider").trim().isIn(paymentProviders),
  body("paymentMethodType").optional().trim().isIn(["payfast"]),
  body("forceDuplicate").optional().isBoolean(),
  body("couponCode").optional().trim().isString(),
  body("shippingAddress").optional().isObject(),
  body("shippingAddress.country").optional().trim().equals("ZA").withMessage("Hair By Paris delivers within South Africa only")
];

const checkoutSummaryValidator = [query("couponCode").optional().trim().isString()];

const adminUpdateOrderValidator = [
  body("trackingNumber").optional().trim().isString(),
  body("trackingUrl").optional({ values: "falsy" }).trim().isURL(),
  body("status").optional().trim().isIn(["pending", "paid", "processing", "packed", "shipped", "delivered", "cancelled"])
];

module.exports = { createOrderValidator, checkoutSummaryValidator, adminUpdateOrderValidator, paymentProviders };
