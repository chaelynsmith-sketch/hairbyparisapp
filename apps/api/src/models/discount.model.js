const mongoose = require("mongoose");

const discountSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", index: true, required: true },
    code: { type: String, required: true },
    type: { type: String, enum: ["percentage", "fixed"], required: true },
    value: { type: Number, required: true },
    minimumSpend: Number,
    active: { type: Boolean, default: true },
    expiresAt: Date
  },
  { timestamps: true }
);

discountSchema.index({ storeId: 1, code: 1 }, { unique: true });

const Discount = mongoose.model("Discount", discountSchema);

module.exports = { Discount };
