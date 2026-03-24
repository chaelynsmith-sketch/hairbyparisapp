const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["image", "video"], default: "image" },
    url: String,
    alt: String
  },
  { _id: false }
);

const inventorySchema = new mongoose.Schema(
  {
    sku: { type: String, required: true },
    quantity: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 5 }
  },
  { _id: false }
);

const pricingSchema = new mongoose.Schema(
  {
    baseCurrency: { type: String, default: "ZAR" },
    amount: { type: Number, required: true },
    saleAmount: Number
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", index: true, required: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    category: {
      type: String,
      required: true,
      index: true
    },
    name: { type: String, required: true, index: "text" },
    slug: { type: String, required: true, index: true },
    description: { type: String, required: true },
    tags: [String],
    media: [mediaSchema],
    pricing: pricingSchema,
    inventory: inventorySchema,
    attributes: {
      brand: String,
      color: String,
      length: String,
      texture: String,
      material: String
    },
    recommendationSignals: {
      hairTypes: [String],
      useCases: [String]
    },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ["draft", "active", "archived"], default: "active" }
  },
  { timestamps: true }
);

productSchema.index({ storeId: 1, slug: 1 }, { unique: true });

const Product = mongoose.model("Product", productSchema);

module.exports = { Product };
