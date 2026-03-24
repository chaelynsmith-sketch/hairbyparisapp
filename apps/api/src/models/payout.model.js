const mongoose = require("mongoose");

const payoutSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", index: true, required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", index: true, required: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", index: true },
    recipientType: { type: String, enum: ["supplier", "admin"], required: true },
    recipientName: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    status: { type: String, enum: ["pending", "paid", "cancelled"], default: "pending" },
    method: { type: String, default: "manual_transfer" },
    destinationLabel: String,
    paidAt: Date,
    notes: String
  },
  { timestamps: true }
);

const Payout = mongoose.model("Payout", payoutSchema);

module.exports = { Payout };
