const { Cart } = require("../models/cart.model");
const { Product } = require("../models/product.model");
const { Order } = require("../models/order.model");
const { Discount } = require("../models/discount.model");
const { convertCurrency } = require("./currency.service");
const { dispatchOrderToSupplier } = require("./supplier.service");
const { sendPushNotification } = require("./notification.service");
const { ApiError } = require("../utils/api-error");

function createOrderNumber() {
  return `HBP-${Date.now().toString().slice(-8)}`;
}

function buildCartFingerprint(items = [], couponCode = "") {
  return JSON.stringify({
    couponCode: couponCode || "",
    items: items
      .map((item) => ({
        productId: item.productId.id || item.productId._id || item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        currency: item.currency
      }))
      .sort((left, right) => String(left.productId).localeCompare(String(right.productId)))
  });
}

async function expireStalePendingOrders({ userId, storeId }) {
  const staleOrders = await Order.find({
    userId,
    storeId,
    status: "pending",
    expiresAt: { $lte: new Date() },
    "payment.status": "pending"
  });

  for (const order of staleOrders) {
    order.status = "cancelled";
    order.payment.status = "cancelled";
    order.trackingEvents.push({
      status: "cancelled",
      message: "Pending payment window expired."
    });
    await order.save();
  }
}

async function buildCheckoutSummary({ user, store, couponCode }) {
  const cart = await Cart.findOne({ userId: user.id }).populate("items.productId");
  const items = cart?.items || [];
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const shipping = subtotal >= (store.shippingConfig?.freeShippingThreshold || 1500) ? 0 : 135;

  let discountAmount = 0;
  if (couponCode) {
    // Coupons are store-scoped so multi-tenant stores can run independent promotions.
    const discount = await Discount.findOne({
      storeId: store.id,
      code: couponCode.toUpperCase(),
      active: true
    });

    if (discount) {
      discountAmount =
        discount.type === "percentage"
          ? subtotal * (discount.value / 100)
          : Math.min(discount.value, subtotal);
    }
  }

  return {
    cart,
    items,
    totals: {
      subtotal,
      shipping,
      discount: Number(discountAmount.toFixed(2)),
      tax: Number((subtotal * 0.15).toFixed(2)),
      grandTotal: Number((subtotal + shipping + subtotal * 0.15 - discountAmount).toFixed(2)),
      currency: store.defaultCurrency
    }
  };
}

async function placeOrder({ user, store, shippingAddress, paymentProvider, paymentMethodType, couponCode, forceDuplicate }) {
  const { cart, items, totals } = await buildCheckoutSummary({ user, store, couponCode });

  if (!items.length) {
    throw new ApiError(400, "Your cart is empty");
  }

  await expireStalePendingOrders({ userId: user.id, storeId: store.id });
  const cartFingerprint = buildCartFingerprint(items, couponCode);
  const existingPendingOrder = await Order.findOne({
    userId: user.id,
    storeId: store.id,
    status: "pending",
    "payment.status": "pending",
    cartFingerprint,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (existingPendingOrder && !forceDuplicate) {
    await sendPushNotification({
      userId: user.id,
      title: "Duplicate order detected",
      body: `You already have a pending order (${existingPendingOrder.orderNumber}) for this same cart. Open checkout to stop the duplicate or continue with a second order.`,
      data: {
        orderId: existingPendingOrder.id,
        type: "duplicate_order_warning"
      }
    });

    throw new ApiError(409, "A pending order for this same cart already exists. Choose whether to stop the duplicate or continue.", {
      duplicateAttempt: true,
      existingOrderId: existingPendingOrder.id,
      existingOrderNumber: existingPendingOrder.orderNumber
    });
  }

  const estimatedStart = new Date();
  const estimatedEnd = new Date();
  const expiresAt = new Date();
  estimatedStart.setDate(estimatedStart.getDate() + (store.shippingConfig?.standardDeliveryDays?.min || 3));
  estimatedEnd.setDate(estimatedEnd.getDate() + (store.shippingConfig?.standardDeliveryDays?.max || 7));
  expiresAt.setMinutes(expiresAt.getMinutes() + 30);

  const order = await Order.create({
    storeId: store.id,
    userId: user.id,
    orderNumber: createOrderNumber(),
    items: items.map((item) => ({
      productId: item.productId.id,
      supplierId: item.productId.supplierId,
      name: item.productId.name,
      sku: item.productId.inventory.sku,
      supplierPlatform: item.productId.sourcing?.platform,
      supplierSourceUrl: item.productId.sourcing?.sourceUrl,
      supplierReference: item.productId.sourcing?.supplierReference,
      quantity: item.quantity,
      unitPrice: convertCurrency(item.unitPrice, item.currency, store.defaultCurrency),
      currency: store.defaultCurrency
    })),
    totals,
    cartFingerprint,
    expiresAt,
    shippingAddress,
    payment: {
      provider: paymentProvider,
      methodType: paymentMethodType || paymentProvider,
      status: "pending"
    },
    fulfillment: {
      estimatedDeliveryStart: estimatedStart,
      estimatedDeliveryEnd: estimatedEnd
    },
    trackingEvents: [
      {
        status: "pending",
        message: "Order placed and awaiting payment"
      }
    ]
  });

  if (items.length) {
    // Inventory is decremented at order creation time to avoid overselling during manual supplier review.
    await Product.bulkWrite(
      items.map((item) => ({
        updateOne: {
          filter: { _id: item.productId.id },
          update: { $inc: { "inventory.quantity": -item.quantity } }
        }
      }))
    );
  }

  const supplierDispatch = await dispatchOrderToSupplier(order);
  order.fulfillment.supplierDispatchStatus = supplierDispatch.some(
    (entry) => entry.status === "manual_action_required"
  )
    ? "manual_review"
    : "dispatched";
  await order.save();

  if (cart) {
    cart.items = [];
    cart.couponCode = null;
    await cart.save();
  }

  await sendPushNotification({
    userId: user.id,
    title: "Order received",
    body: `Your order ${order.orderNumber} has been placed successfully.`,
    data: { orderId: order.id }
  });

  return { order, supplierDispatch, duplicateAttempt: Boolean(existingPendingOrder && forceDuplicate) };
}

module.exports = { buildCheckoutSummary, placeOrder };
