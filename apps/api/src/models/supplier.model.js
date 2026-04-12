const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", index: true, required: true },
    name: { type: String, required: true },
    mode: { type: String, enum: ["api", "email", "manual"], default: "manual" },
    apiEndpoint: String,
    apiKey: String,
    email: String,
    leadTimeDays: { min: Number, max: Number },
    stockSyncEnabled: { type: Boolean, default: false },
    pricingRules: {
      markupPercentage: Number,
      defaultCurrency: String
    },
    payoutConfig: {
      method: { type: String, default: "manual_transfer" },
      destinationLabel: String
    },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const Supplier = mongoose.model("Supplier", supplierSchema);

module.exports = { Supplier };
