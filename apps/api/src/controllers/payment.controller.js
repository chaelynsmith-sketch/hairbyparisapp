const {
  getEnabledPaymentMethods,
  verifySharedSecretWebhook,
  reconcilePaymentUpdate
} = require("../services/payment.service");
const { ApiError } = require("../utils/api-error");

async function listPaymentMethods(req, res) {
  res.json({
    paymentMethods: getEnabledPaymentMethods(req.store)
  });
}

async function payfastWebhook(req, res) {
  verifySharedSecretWebhook("payfast", req.headers["x-payfast-secret"]);

  const paymentState = String(req.body.payment_status || "").toUpperCase();
  const paymentStatus =
    paymentState === "COMPLETE" ? "paid" : paymentState === "CANCELLED" ? "cancelled" : "failed";

  await reconcilePaymentUpdate({
    orderId: req.body.m_payment_id || req.body.custom_str1 || req.body.orderId,
    provider: "payfast",
    paymentStatus,
    transactionId: req.body.pf_payment_id,
    eventStatus: paymentStatus === "paid" ? "paid" : paymentStatus === "cancelled" ? "cancelled" : "payment_failed",
    eventMessage:
      paymentStatus === "paid"
        ? "PayFast payment confirmed."
        : paymentStatus === "cancelled"
          ? "PayFast payment was cancelled."
          : "PayFast payment failed."
  });

  res.json({ received: true });
}

async function simulatePaymentWebhook(req, res) {
  if (process.env.NODE_ENV === "production") {
    throw new ApiError(404, "Not found");
  }

  const statusMap = {
    paid: {
      paymentStatus: "paid",
      eventStatus: "paid",
      eventMessage: "Development PayFast payment marked as paid."
    },
    failed: {
      paymentStatus: "failed",
      eventStatus: "payment_failed",
      eventMessage: "Development PayFast payment marked as failed."
    },
    refunded: {
      paymentStatus: "refunded",
      eventStatus: "refunded",
      eventMessage: "Development PayFast payment marked as refunded."
    }
  };
  const selected = statusMap[req.body.status];

  if (!selected) {
    throw new ApiError(400, "Unsupported simulated payment status");
  }

  const order = await reconcilePaymentUpdate({
    orderId: req.body.orderId,
    provider: "payfast",
    transactionId: `dev-payfast-${Date.now()}`,
    ...selected
  });

  res.json({ order });
}

module.exports = {
  listPaymentMethods,
  payfastWebhook,
  simulatePaymentWebhook
};
