const mongoose = require("mongoose");
const { Product } = require("../models/product.model");
const { Review } = require("../models/review.model");
const { Cart } = require("../models/cart.model");
const { convertCurrency } = require("../services/currency.service");
const { normalizeProductMedia } = require("../utils/media-url");
const { ApiError } = require("../utils/api-error");

function sanitizePublicProduct(product) {
  const value = product.toObject ? product.toObject() : { ...product };
  delete value.sourcing;
  value.media = normalizeProductMedia(value.media || []);
  value.variants = (value.variants || []).map((variant) => ({
    ...variant,
    media: normalizeProductMedia(variant.media || [])
  }));
  return value;
}

function slugify(value = "product") {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function generateSku(name, category) {
  const categoryCode = String(category || "HBP")
    .replace(/&/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
  const nameCode = String(name || "PRODUCT")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 14);
  const suffix = Date.now().toString().slice(-5);

  return `HBP-${categoryCode || "CAT"}-${nameCode || "ITEM"}-${suffix}`;
}

function normalizeProductPayload(body) {
  const payload = { ...body };

  if (payload.name || payload.slug) {
    payload.slug = slugify(payload.slug || payload.name);
  }

  if (payload.inventory || payload.name || payload.category) {
    const inventory = { ...(payload.inventory || {}) };
    inventory.sku = inventory.sku?.trim() || generateSku(payload.name, payload.category);
    payload.inventory = inventory;
  }

  return payload;
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
  const payload = normalizeProductPayload(req.body);
  const product = await Product.create({
    ...payload,
    storeId: req.storeId
  }).catch((error) => {
    if (error.code === 11000) {
      throw new ApiError(409, "A product with this slug already exists. Change the product name or slug.");
    }

    throw error;
  });
  res.status(201).json({ product });
}

async function updateProduct(req, res) {
  const payload = normalizeProductPayload(req.body);
  const product = await Product.findOneAndUpdate(
    { _id: req.params.productId, storeId: req.storeId },
    {
      $set: {
        ...payload,
        storeId: req.storeId
      }
    },
    { new: true, runValidators: true }
  );

  res.json({ product });
}

async function deleteProduct(req, res) {
  const product = await Product.findOneAndDelete({ _id: req.params.productId, storeId: req.storeId });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  await Cart.updateMany(
    { storeId: req.storeId },
    { $pull: { items: { productId: product._id } } }
  );

  res.json({ message: `${product.name} deleted successfully`, productId: product.id });
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };
