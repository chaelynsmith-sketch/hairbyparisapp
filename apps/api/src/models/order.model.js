const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    name: String,
    sku: String,
    quantity: Number,
    unitPrice: Number,
    currency: String
  },
  { _id: false }
);

const trackingEventSchema = new mongoose.Schema(
  {
    status: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", index: true, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    orderNumber: { type: String, required: true, unique: true },
    items: [orderItemSchema],
    totals: {
      subtotal: Number,
      shipping: Number,
      discount: Number,
      tax: Number,
      grandTotal: Number,
      currency: String
    },
    cartFingerprint: { type: String, index: true },
    expiresAt: Date,
    shippingAddress: {
      recipientName: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      phone: String
    },
    payment: {
      provider: String,
      methodType: String,
      status: { type: String, default: "pending" },
      transactionId: String
    },
    fulfillment: {
      type: { type: String, enum: ["dropship", "manual"], default: "dropship" },
      supplierDispatchStatus: { type: String, default: "queued" },
      estimatedDeliveryStart: Date,
      estimatedDeliveryEnd: Date,
      trackingNumber: String,
      trackingUrl: String,
      guaranteeStatus: {
        type: String,
        enum: ["on_track", "at_risk", "eligible_for_compensation", "resolved"],
        default: "on_track"
      }
    },
    status: {
      type: String,
      enum: ["pending", "paid", "processing", "shipped", "delivered", "cancelled"],
      default: "pending"
    },
    trackingEvents: [trackingEventSchema]
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = { Order };
