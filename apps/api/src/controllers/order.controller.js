const { Order } = require("../models/order.model");
const { buildCheckoutSummary, placeOrder } = require("../services/order.service");
const { ApiError } = require("../utils/api-error");
const {
  createPaymentIntent,
  assertPaymentProviderAllowed,
  assertPaymentProviderConfigured
} = require("../services/payment.service");

function sanitizeCustomerOrder(order) {
  const value = order.toObject ? order.toObject() : { ...order };
  value.items = (value.items || []).map((item) => {
    const nextItem = { ...item };
    delete nextItem.supplierPlatform;
    delete nextItem.supplierSourceUrl;
    delete nextItem.supplierReference;
    return nextItem;
  });

  if (value.fulfillment) {
    delete value.fulfillment.supplierOrderPlacedAt;
    delete value.fulfillment.supplierOrderReference;
    delete value.fulfillment.supplierNotes;
  }

  return value;
}

async function getCheckoutSummary(req, res) {
  const summary = await buildCheckoutSummary({
    user: req.user,
    store: req.store,
    couponCode: req.query.couponCode
  });
  res.json(summary);
}

async function createOrder(req, res) {
  assertPaymentProviderAllowed(req.store, req.body.paymentProvider);
  assertPaymentProviderConfigured(req.body.paymentProvider);

  const { order, supplierDispatch, duplicateAttempt } = await placeOrder({
    user: req.user,
    store: req.store,
    shippingAddress: req.body.shippingAddress,
    paymentProvider: req.body.paymentProvider,
    paymentMethodType: req.body.paymentMethodType,
    couponCode: req.body.couponCode,
    forceDuplicate: req.body.forceDuplicate
  });

  const paymentIntent = await createPaymentIntent({
    amount: order.totals.grandTotal,
    currency: order.totals.currency,
    provider: req.body.paymentProvider,
    metadata: {
      orderId: order.id,
      storeId: req.storeId,
      userId: req.user.id,
      paymentMethodType: req.body.paymentMethodType || req.body.paymentProvider
    }
  });

  res.status(201).json({ order, supplierDispatch, paymentIntent, duplicateAttempt });
}

async function listOrders(req, res) {
  const filters = req.user.role === "customer" ? { userId: req.user.id } : { storeId: req.storeId };
  const orders = await Order.find(filters).sort({ createdAt: -1 }).limit(100);
  res.json({
    orders: req.user.role === "customer" ? orders.map((order) => sanitizeCustomerOrder(order)) : orders
  });
}

async function trackOrder(req, res) {
  const order = await Order.findOne({ _id: req.params.orderId, storeId: req.storeId });

  if (order?.expiresAt && new Date() > order.expiresAt && order.status === "pending" && order.payment?.status === "pending") {
    order.status = "cancelled";
    order.payment.status = "cancelled";
    order.trackingEvents.push({
      status: "cancelled",
      message: "Pending payment window expired."
    });
    await order.save();
  }

  if (
    order?.fulfillment?.estimatedDeliveryEnd &&
    new Date() > order.fulfillment.estimatedDeliveryEnd &&
    order.status !== "delivered"
  ) {
    order.fulfillment.guaranteeStatus = "eligible_for_compensation";
    await order.save();
  }

  res.json({ order: req.user.role === "customer" ? sanitizeCustomerOrder(order) : order });
}

async function adminUpdateOrder(req, res) {
  const order = await Order.findOne({ _id: req.params.orderId, storeId: req.storeId });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (req.body.supplierDispatchStatus) {
    order.fulfillment.supplierDispatchStatus = req.body.supplierDispatchStatus;
  }

  if (typeof req.body.supplierOrderReference === "string") {
    order.fulfillment.supplierOrderReference = req.body.supplierOrderReference;
  }

  if (typeof req.body.supplierNotes === "string") {
    order.fulfillment.supplierNotes = req.body.supplierNotes;
  }

  if (req.body.supplierDispatchStatus === "supplier_order_placed") {
    order.fulfillment.supplierOrderPlacedAt = new Date();
  }

  if (typeof req.body.trackingNumber === "string") {
    order.fulfillment.trackingNumber = req.body.trackingNumber;
  }

  if (typeof req.body.trackingUrl === "string") {
    order.fulfillment.trackingUrl = req.body.trackingUrl;
  }

  if (req.body.status) {
    order.status = req.body.status;
  }

  order.trackingEvents.push({
    status: req.body.status || order.status,
    message: "Admin updated dispatch or tracking details."
  });

  await order.save();
  res.json({ order });
}

module.exports = { getCheckoutSummary, createOrder, listOrders, trackOrder, adminUpdateOrder };
