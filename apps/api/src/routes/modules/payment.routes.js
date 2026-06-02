const express = require("express");
const {
  listPaymentMethods,
  payfastWebhook,
  simulatePaymentWebhook
} = require("../../controllers/payment.controller");
const { authenticate, requireRole } = require("../../middleware/auth.middleware");
const { resolveStore } = require("../../middleware/store.middleware");
const { asyncHandler } = require("../../utils/async-handler");
const { body } = require("express-validator");
const { validateRequest } = require("../../middleware/validate.middleware");

const paymentRouter = express.Router();
const paymentWebhookRouter = express.Router();

paymentRouter.get("/methods", resolveStore, asyncHandler(listPaymentMethods));
paymentRouter.post(
  "/simulate",
  authenticate,
  requireRole("admin", "super_admin"),
  [
    body("orderId").trim().notEmpty(),
    body("provider").optional().trim().isIn(["payfast"]),
    body("status").trim().isIn(["paid", "failed", "refunded"])
  ],
  validateRequest,
  asyncHandler(simulatePaymentWebhook)
);
paymentWebhookRouter.post("/payfast", express.urlencoded({ extended: false }), asyncHandler(payfastWebhook));

module.exports = { paymentRouter, paymentWebhookRouter };
