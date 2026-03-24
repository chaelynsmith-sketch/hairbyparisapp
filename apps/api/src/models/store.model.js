const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    region: { type: String, required: true },
    country: { type: String, required: true },
    defaultCurrency: { type: String, required: true, default: "ZAR" },
    locales: { type: [String], default: ["en"] },
    branding: {
      logoUrl: String,
      heroImageUrl: String,
      primaryColor: String,
      accentColor: String
    },
    shippingConfig: {
      freeShippingThreshold: Number,
      standardDeliveryDays: { min: Number, max: Number },
      expressDeliveryDays: { min: Number, max: Number }
    },
    paymentMethods: {
      stripe: { type: Boolean, default: true },
      paypal: { type: Boolean, default: true },
      payfast: { type: Boolean, default: true },
      ozow: { type: Boolean, default: false }
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const Store = mongoose.model("Store", storeSchema);

module.exports = { Store };
