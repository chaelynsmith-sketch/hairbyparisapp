const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", index: true, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, required: true },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        variantId: String,
        variantLabel: String,
        sku: String,
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true },
        currency: { type: String, required: true }
      }
    ],
    couponCode: String
  },
  { timestamps: true }
);

const Cart = mongoose.model("Cart", cartSchema);

module.exports = { Cart };
