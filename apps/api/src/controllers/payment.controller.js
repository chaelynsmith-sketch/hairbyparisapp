const {
  getEnabledPaymentMethods,
  verifyStripeWebhookEvent,
  verifyPayPalWebhookEvent,
  verifySharedSecretWebhook,
  reconcilePaymentUpdate
} = require("../services/payment.service");
const { ApiError } = require("../utils/api-error");

async function listPaymentMethods(req, res) {
  res.json({
    paymentMethods: getEnabledPaymentMethods(req.store)
  });
}

async function stripeWebhook(req, res) {
  const signature = req.headers["stripe-signature"];
  const event = verifyStripeWebhookEvent(req.body, signature);

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    await reconcilePaymentUpdate({
      orderId: intent.metadata?.orderId,
      provider: "stripe",
      paymentStatus: "paid",
      transactionId: intent.id,
      eventStatus: "paid",
      eventMessage: "Stripe payment confirmed."
    });
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object;
    await reconcilePaymentUpdate({
      orderId: intent.metadata?.orderId,
      provider: "stripe",
      paymentStatus: "failed",
      transactionId: intent.id,
      eventStatus: "payment_failed",
      eventMessage: "Stripe payment failed."
    });
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object;
    await reconcilePaymentUpdate({
      orderId: charge.metadata?.orderId,
      provider: "stripe",
      paymentStatus: "refunded",
      transactionId: charge.payment_intent || charge.id,
      eventStatus: "refunded",
      eventMessage: "Stripe payment refunded."
    });
  }

  res.json({ received: true });
}

async function paypalWebhook(req, res) {
  const event = await verifyPayPalWebhookEvent(req.headers, req.body);
  const resource = event.resource || {};
  const orderId =
    resource.custom_id ||
    resource.invoice_id ||
    resource.supplementary_data?.related_ids?.order_id ||
    resource.metadata?.orderId;

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    await reconcilePaymentUpdate({
      orderId,
      provider: "paypal",
      paymentStatus: "paid",
      transactionId: resource.id,
      eventStatus: "paid",
      eventMessage: "PayPal payment confirmed."
    });
  }

  if (event.event_type === "PAYMENT.CAPTURE.DENIED") {
    await reconcilePaymentUpdate({
      orderId,
      provider: "paypal",
      paymentStatus: "failed",
      transactionId: resource.id,
      eventStatus: "payment_failed",
      eventMessage: "PayPal payment was denied."
    });
  }

  if (event.event_type === "PAYMENT.CAPTURE.REFUNDED") {
    await reconcilePaymentUpdate({
      orderId,
      provider: "paypal",
      paymentStatus: "refunded",
      transactionId: resource.id,
      eventStatus: "refunded",
      eventMessage: "PayPal payment refunded."
    });
  }

  res.json({ received: true });
}

async function payfastWebhook(req, res) {
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

async function ozowWebhook(req, res) {
  verifySharedSecretWebhook("ozow", req.headers["x-ozow-secret"]);

  const status = String(req.body.TransactionStatus || req.body.status || "").toLowerCase();
  const paymentStatus = status === "complete" || status === "successful" ? "paid" : "failed";
  await reconcilePaymentUpdate({
    orderId: req.body.TransactionReference || req.body.orderId,
    provider: "ozow",
    paymentStatus,
    transactionId: req.body.TransactionId || req.body.transactionId,
    eventStatus: paymentStatus === "paid" ? "paid" : "payment_failed",
    eventMessage: paymentStatus === "paid" ? "Ozow payment confirmed." : "Ozow payment failed."
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
      eventMessage: "Development payment marked as paid."
    },
    failed: {
      paymentStatus: "failed",
      eventStatus: "payment_failed",
      eventMessage: "Development payment marked as failed."
    },
    refunded: {
      paymentStatus: "refunded",
      eventStatus: "refunded",
      eventMessage: "Development payment marked as refunded."
    }
  };

  const selected = statusMap[req.body.status];

  if (!selected) {
    throw new ApiError(400, "Unsupported simulated payment status");
  }

  const order = await reconcilePaymentUpdate({
    orderId: req.body.orderId,
    provider: req.body.provider,
    transactionId: `dev-${req.body.provider}-${Date.now()}`,
    ...selected
  });

  res.json({ order });
}

module.exports = {
  listPaymentMethods,
  stripeWebhook,
  paypalWebhook,
  payfastWebhook,
  ozowWebhook,
  simulatePaymentWebhook
};
