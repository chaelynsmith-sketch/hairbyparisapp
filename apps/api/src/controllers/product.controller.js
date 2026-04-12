const mongoose = require("mongoose");
const { Product } = require("../models/product.model");
const { Review } = require("../models/review.model");
const { convertCurrency } = require("../services/currency.service");
const { normalizeProductMedia } = require("../utils/media-url");

function sanitizePublicProduct(product) {
  const value = product.toObject ? product.toObject() : { ...product };
  delete value.sourcing;
  value.media = normalizeProductMedia(value.media || []);
  return value;
}

async function listProducts(req, res) {
  const filters = {
    storeId: req.storeId,
    status: "active"
  };

  if (req.query.category) {
    filters.category = req.query.category;
  }

  if (req.query.featured) {
    filters.featured = req.query.featured === "true";
  }

  if (req.query.search) {
    filters.$text = { $search: req.query.search };
  }

  const products = await Product.find(filters).sort({ featured: -1, createdAt: -1 }).limit(50);
  const currency = req.query.currency || req.store.defaultCurrency;

  res.json({
    products: products.map((product) => ({
      ...sanitizePublicProduct(product),
      displayPrice: convertCurrency(
        product.pricing.saleAmount || product.pricing.amount,
        product.pricing.baseCurrency,
        currency
      ),
      displayCurrency: currency
    }))
  });
}

async function getProduct(req, res) {
  const product = await Product.findOne({ _id: req.params.productId, storeId: req.storeId });
  const reviews = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(req.params.productId) } },
    {
      $group: {
        _id: "$productId",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  res.json({
    product: product ? sanitizePublicProduct(product) : null,
    reviewSummary: reviews[0] || { averageRating: 0, totalReviews: 0 }
  });
}

async function createProduct(req, res) {
  const product = await Product.create({
    ...req.body,
    storeId: req.storeId
  });
  res.status(201).json({ product });
}

async function updateProduct(req, res) {
  const product = await Product.findOneAndUpdate(
    { _id: req.params.productId, storeId: req.storeId },
    {
      $set: {
        ...req.body,
        storeId: req.storeId
      }
    },
    { new: true, runValidators: true }
  );

  res.json({ product });
}

module.exports = { listProducts, getProduct, createProduct, updateProduct };
