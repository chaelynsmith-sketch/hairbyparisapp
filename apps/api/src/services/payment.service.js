const crypto = require("crypto");
const { ApiError } = require("../utils/api-error");
const { Order } = require("../models/order.model");

const SUPPORTED_PAYMENT_PROVIDERS = ["payfast"];

function getEnabledPaymentMethods(store) {
  return Object.entries(store.paymentMethods || {})
    .filter(([key, enabled]) => key === "payfast" && Boolean(enabled))
    .map(([key]) => key);
}

function sanitizePaymentMetadata(metadata = {}) {
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value).slice(0, 500)])
  );
}

function assertPaymentProviderAllowed(store, provider) {
  if (provider !== "payfast") {
    throw new ApiError(400, "Hair By Paris accepts PayFast only");
  }

  if (!getEnabledPaymentMethods(store).includes("payfast")) {
    throw new ApiError(400, "PayFast is not enabled for this store");
  }
}

function assertPaymentProviderConfigured(provider) {
  if (provider !== "payfast") {
    throw new ApiError(400, "Hair By Paris accepts PayFast only");
  }

  if (!process.env.PAYFAST_MERCHANT_ID || !process.env.PAYFAST_MERCHANT_KEY) {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    throw new ApiError(500, "PayFast is not configured");
  }
}

function getClientUrl() {
  const frontendUrl =
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL
      ?.split(",")
      .map((value) => value.trim())
      .find(Boolean);

  if (!frontendUrl) {
    return "http://localhost:8082";
  }

  return /^https?:\/\//i.test(frontendUrl) ? frontendUrl : `https://${frontendUrl}`;
}

function getApiBaseUrl() {
  const apiBaseUrl = process.env.API_BASE_URL?.trim();

  if (!apiBaseUrl) {
    return "http://localhost:4000";
  }

  return /^https?:\/\//i.test(apiBaseUrl) ? apiBaseUrl : `https://${apiBaseUrl}`;
}

function getPayFastProcessUrl() {
  if (process.env.PAYFAST_PROCESS_URL) {
    return process.env.PAYFAST_PROCESS_URL;
  }

  return process.env.PAYFAST_SANDBOX === "true"
    ? "https://sandbox.payfast.co.za/eng/process"
    : "https://www.payfast.co.za/eng/process";
}

function isPlaceholderEmail(value) {
  if (!value) {
    return true;
  }

  return /your-gmail-address@gmail\.com/i.test(value) || /example\.com$/i.test(value);
}

function getPayFastCustomerEmail(metadata) {
  const customerEmail = metadata.customerEmail?.trim();
  if (customerEmail && !isPlaceholderEmail(customerEmail)) {
    return customerEmail;
  }

  const smtpEmail = process.env.SMTP_USER?.trim();
  if (smtpEmail && !isPlaceholderEmail(smtpEmail)) {
    return smtpEmail;
  }

  throw new ApiError(500, "PayFast requires a real customer email before checkout can continue");
}

function buildPayFastSignature(fields, passphrase) {
  const query = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value).trim()).replace(/%20/g, "+")}`)
    .join("&");

  const payload = passphrase ? `${query}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, "+")}` : query;
  return crypto.createHash("md5").update(payload).digest("hex");
}

function verifySharedSecretWebhook(_provider, receivedSecret) {
  const expectedSecret = process.env.PAYFAST_WEBHOOK_SECRET;

  if (!expectedSecret) {
    throw new ApiError(500, "PayFast webhook secret is not configured");
  }

  if (!receivedSecret || receivedSecret !== expectedSecret) {
    throw new ApiError(400, "Invalid PayFast webhook secret");
  }
}

function mapPaymentStateToOrderStatus(paymentStatus) {
  if (paymentStatus === "paid") {
    return "paid";
  }

  if (paymentStatus === "failed" || paymentStatus === "cancelled" || paymentStatus === "refunded") {
    return "cancelled";
  }

  return "pending";
}

async function reconcilePaymentUpdate({ orderId, provider, paymentStatus, transactionId, eventStatus, eventMessage }) {
  if (!orderId) {
    throw new ApiError(400, "Order reference is required for payment reconciliation");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found for payment reconciliation");
  }

  order.payment.provider = provider || "payfast";
  order.payment.status = paymentStatus;
  if (transactionId) {
    order.payment.transactionId = transactionId;
  }

  order.status = mapPaymentStateToOrderStatus(paymentStatus);

  const hasEvent = order.trackingEvents.some(
    (event) => event.status === eventStatus && event.message === eventMessage
  );

  if (!hasEvent) {
    order.trackingEvents.push({ status: eventStatus, message: eventMessage });
  }

  await order.save();
  return order;
}

async function createPaymentIntent({ amount, provider, metadata }) {
  assertPaymentProviderConfigured(provider);
  const sanitizedMetadata = sanitizePaymentMetadata(metadata);

  if (!process.env.PAYFAST_MERCHANT_ID || !process.env.PAYFAST_MERCHANT_KEY) {
    return {
      provider: "payfast",
      status: "mock_pending",
      redirectUrl: "https://sandbox.payfast.mock/redirect"
    };
  }

  const clientUrl = getClientUrl();
  const notifyUrl = `${getApiBaseUrl()}/api/v1/payments/webhooks/payfast`;
  const paymentFields = {
    merchant_id: process.env.PAYFAST_MERCHANT_ID,
    merchant_key: process.env.PAYFAST_MERCHANT_KEY,
    return_url: clientUrl,
    cancel_url: clientUrl,
    notify_url: notifyUrl,
    name_first: sanitizedMetadata.customerFirstName || "Hair",
    name_last: sanitizedMetadata.customerLastName || "By Paris",
    email_address: getPayFastCustomerEmail(sanitizedMetadata),
    m_payment_id: sanitizedMetadata.orderId,
    amount: Number(amount).toFixed(2),
    item_name: `Hair By Paris Order ${sanitizedMetadata.orderId || ""}`.trim(),
    item_description: `Payment for order ${sanitizedMetadata.orderId || ""}`.trim(),
    custom_str1: sanitizedMetadata.orderId || "",
    custom_str2: sanitizedMetadata.userId || ""
  };
  const signature = buildPayFastSignature(paymentFields, process.env.PAYFAST_PASSPHRASE || "");
  const query = new URLSearchParams({
    ...Object.fromEntries(Object.entries(paymentFields).map(([key, value]) => [key, String(value)])),
    signature
  });

  return {
    provider: "payfast",
    status: "pending",
    redirectUrl: `${getPayFastProcessUrl()}?${query.toString()}`
  };
}

module.exports = {
  SUPPORTED_PAYMENT_PROVIDERS,
  createPaymentIntent,
  getEnabledPaymentMethods,
  assertPaymentProviderAllowed,
  assertPaymentProviderConfigured,
  verifySharedSecretWebhook,
  reconcilePaymentUpdate
};
