const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", index: true, required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", index: true, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    rating: { type: Number, min: 1, max: 5, required: true },
    title: String,
    comment: String,
    media: [{ url: String, type: String }],
    verifiedPurchase: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const Review = mongoose.model("Review", reviewSchema);

module.exports = { Review };
