const Stripe = require("stripe");
const { ApiError } = require("../utils/api-error");
const { Order } = require("../models/order.model");
const { syncPayoutsForPaymentStatus } = require("./payout.service");

const SUPPORTED_PAYMENT_PROVIDERS = ["stripe", "paypal", "payfast", "ozow"];

function getEnabledPaymentMethods(store) {
  return Object.entries(store.paymentMethods || {})
    .filter(([, enabled]) => Boolean(enabled))
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
  if (!SUPPORTED_PAYMENT_PROVIDERS.includes(provider)) {
    throw new ApiError(400, "Unsupported payment provider");
  }

  const enabledMethods = getEnabledPaymentMethods(store);

  if (!enabledMethods.includes(provider)) {
    throw new ApiError(400, "Selected payment method is not enabled for this store");
  }
}

function assertPaymentProviderConfigured(provider) {
  if (provider === "stripe") {
    if (!process.env.STRIPE_SECRET_KEY) {
      if (process.env.NODE_ENV !== "production") {
        return;
      }

      throw new ApiError(500, "Stripe is not configured");
    }

    return;
  }

  if (provider === "paypal") {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      if (process.env.NODE_ENV !== "production") {
        return;
      }

      throw new ApiError(500, "PayPal is not configured");
    }

    return;
  }

  if (provider === "payfast" || provider === "ozow") {
    const providerConfigured =
      provider === "payfast"
        ? process.env.PAYFAST_MERCHANT_ID && process.env.PAYFAST_MERCHANT_KEY
        : process.env.OZOW_SITE_CODE && process.env.OZOW_API_KEY;

    if (!providerConfigured) {
      if (process.env.NODE_ENV !== "production") {
        return;
      }

      throw new ApiError(500, `${provider} is not configured`);
    }

    return;
  }

  throw new ApiError(400, "Unsupported payment provider");
}

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new ApiError(500, "Stripe is not configured");
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

function getClientUrl() {
  return process.env.CLIENT_URL || "http://localhost:8082";
}

function buildPayFastSignature(fields, passphrase) {
  const query = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value).trim()).replace(/%20/g, "+")}`)
    .join("&");

  const payload = passphrase ? `${query}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, "+")}` : query;
  return require("crypto").createHash("md5").update(payload).digest("hex");
}

function verifyStripeWebhookEvent(payload, signature) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new ApiError(500, "Stripe webhook secret is not configured");
  }

  return getStripeClient().webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
}

async function getPayPalAccessToken() {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET || !process.env.PAYPAL_WEBHOOK_ID) {
    throw new ApiError(500, "PayPal webhook verification is not configured");
  }

  const environmentBase =
    process.env.NODE_ENV === "production" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const tokenResponse = await fetch(`${environmentBase}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  if (!tokenResponse.ok) {
    throw new ApiError(502, "Unable to authenticate PayPal webhook verification");
  }

  const tokenData = await tokenResponse.json();
  return { accessToken: tokenData.access_token, environmentBase };
}

async function verifyPayPalWebhookEvent(headers, body) {
  const transmissionId = headers["paypal-transmission-id"];
  const transmissionTime = headers["paypal-transmission-time"];
  const transmissionSig = headers["paypal-transmission-sig"];
  const certUrl = headers["paypal-cert-url"];
  const authAlgo = headers["paypal-auth-algo"];

  if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
    throw new ApiError(400, "Missing PayPal webhook verification headers");
  }

  const { accessToken, environmentBase } = await getPayPalAccessToken();
  const verificationResponse = await fetch(`${environmentBase}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: process.env.PAYPAL_WEBHOOK_ID,
      webhook_event: body
    })
  });

  if (!verificationResponse.ok) {
    throw new ApiError(502, "Unable to verify PayPal webhook signature");
  }

  const verificationResult = await verificationResponse.json();

  if (verificationResult.verification_status !== "SUCCESS") {
    throw new ApiError(400, "Invalid PayPal webhook signature");
  }

  return body;
}

function verifySharedSecretWebhook(provider, receivedSecret) {
  const envKey = provider === "payfast" ? "PAYFAST_WEBHOOK_SECRET" : "OZOW_WEBHOOK_SECRET";
  const expectedSecret = process.env[envKey];

  if (!expectedSecret) {
    throw new ApiError(500, `${provider} webhook secret is not configured`);
  }

  if (!receivedSecret || receivedSecret !== expectedSecret) {
    throw new ApiError(400, `Invalid ${provider} webhook secret`);
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

async function reconcilePaymentUpdate({
  orderId,
  provider,
  paymentStatus,
  transactionId,
  eventStatus,
  eventMessage
}) {
  if (!orderId) {
    throw new ApiError(400, "Order reference is required for payment reconciliation");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found for payment reconciliation");
  }

  order.payment.provider = provider || order.payment.provider;
  order.payment.status = paymentStatus;
  if (transactionId) {
    order.payment.transactionId = transactionId;
  }

  const mappedOrderStatus = mapPaymentStateToOrderStatus(paymentStatus);
  order.status = mappedOrderStatus;

  const hasEvent = order.trackingEvents.some(
    (event) => event.status === eventStatus && event.message === eventMessage
  );

  if (!hasEvent) {
    order.trackingEvents.push({
      status: eventStatus,
      message: eventMessage
    });
  }

  await order.save();
  await syncPayoutsForPaymentStatus(order, paymentStatus);
  return order;
}

async function createPaymentIntent({ amount, currency, provider, metadata }) {
  assertPaymentProviderConfigured(provider);
  const sanitizedMetadata = sanitizePaymentMetadata(metadata);

  if (provider === "stripe") {
    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        provider,
        status: "mock_pending",
        clientSecret: "mock_stripe_client_secret",
        amount,
        currency,
        metadata: sanitizedMetadata
      };
    }

    const stripe = getStripeClient();
    return stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      metadata: sanitizedMetadata
    });
  }

  if (provider === "paypal") {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      return {
        provider,
        status: "mock_pending",
        approvalUrl: "https://sandbox.paypal.mock/checkout"
      };
    }

    return {
      provider,
      status: "pending",
      approvalUrl: "https://www.paypal.com/checkoutnow"
    };
  }

  if (provider === "payfast" || provider === "ozow") {
    const providerConfigured =
      provider === "payfast"
        ? process.env.PAYFAST_MERCHANT_ID && process.env.PAYFAST_MERCHANT_KEY
        : process.env.OZOW_SITE_CODE && process.env.OZOW_API_KEY;

    if (!providerConfigured) {
      return {
        provider,
        status: "mock_pending",
        redirectUrl: `https://sandbox.${provider}.mock/redirect`
      };
    }

    if (provider === "payfast") {
      const clientUrl = getClientUrl();
      const notifyUrl = `${process.env.API_BASE_URL || "https://hair-cy-paris-api.onrender.com"}/api/v1/payments/webhooks/payfast`;
      const paymentFields = {
        merchant_id: process.env.PAYFAST_MERCHANT_ID,
        merchant_key: process.env.PAYFAST_MERCHANT_KEY,
        return_url: clientUrl,
        cancel_url: clientUrl,
        notify_url: notifyUrl,
        name_first: sanitizedMetadata.customerFirstName || "Hair",
        name_last: sanitizedMetadata.customerLastName || "By Paris",
        email_address: sanitizedMetadata.customerEmail || process.env.SMTP_USER || "support@hairbyparis.com",
        m_payment_id: sanitizedMetadata.orderId,
        amount: Number(amount).toFixed(2),
        item_name: `Hair By Paris Order ${sanitizedMetadata.orderId || ""}`.trim(),
        item_description: `Payment for order ${sanitizedMetadata.orderId || ""}`.trim(),
        custom_str1: sanitizedMetadata.orderId || "",
        custom_str2: sanitizedMetadata.userId || ""
      };

      const signature = buildPayFastSignature(paymentFields, process.env.PAYFAST_PASSPHRASE || "");
      const query = new URLSearchParams({
        ...Object.fromEntries(
          Object.entries(paymentFields).map(([key, value]) => [key, String(value)])
        ),
        signature
      });

      return {
        provider,
        status: "pending",
        redirectUrl: `https://www.payfast.co.za/eng/process?${query.toString()}`
      };
    }

    return {
      provider,
      status: "pending",
      redirectUrl: `https://payments.example.com/${provider}`
    };
  }

  throw new ApiError(400, "Unsupported payment provider");
}

module.exports = {
  SUPPORTED_PAYMENT_PROVIDERS,
  createPaymentIntent,
  getEnabledPaymentMethods,
  assertPaymentProviderAllowed,
  assertPaymentProviderConfigured,
  verifyStripeWebhookEvent,
  verifyPayPalWebhookEvent,
  verifySharedSecretWebhook,
  reconcilePaymentUpdate
};
