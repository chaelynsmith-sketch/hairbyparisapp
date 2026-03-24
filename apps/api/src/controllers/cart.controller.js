const { Cart } = require("../models/cart.model");
const { Product } = require("../models/product.model");
const { ApiError } = require("../utils/api-error");

async function getCart(req, res) {
  const cart = await Cart.findOne({ userId: req.user.id }).populate("items.productId");
  res.json({ cart });
}

async function addToCart(req, res) {
  const product = await Product.findOne({ _id: req.body.productId, storeId: req.storeId });

  if (!product) {
    throw new ApiError(404, "Product not found for the selected store");
  }

  let cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) {
    cart = await Cart.create({
      storeId: req.storeId,
      userId: req.user.id,
      items: []
    });
  }

  const existingItem = cart.items.find((item) => item.productId.toString() === req.body.productId);
  if (existingItem) {
    existingItem.quantity += req.body.quantity || 1;
  } else {
    cart.items.push({
      productId: product.id,
      quantity: req.body.quantity || 1,
      unitPrice: product.pricing.saleAmount || product.pricing.amount,
      currency: product.pricing.baseCurrency
    });
  }

  await cart.save();
  await cart.populate("items.productId");
  res.json({ cart, message: `${product.name} added to cart` });
}

async function updateCartItem(req, res) {
  const cart = await Cart.findOne({ userId: req.user.id });

  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const item = cart.items.find((entry) => entry.productId.toString() === req.params.productId);
  if (!item) {
    throw new ApiError(404, "Cart item not found");
  }

  item.quantity = req.body.quantity;
  await cart.save();
  await cart.populate("items.productId");
  res.json({ cart, message: "Cart item quantity updated" });
}

async function removeCartItem(req, res) {
  const cart = await Cart.findOne({ userId: req.user.id });

  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const nextItems = cart.items.filter((entry) => entry.productId.toString() !== req.params.productId);
  if (nextItems.length === cart.items.length) {
    throw new ApiError(404, "Cart item not found");
  }

  cart.items = nextItems;
  await cart.save();
  await cart.populate("items.productId");
  res.json({ cart, message: "Item removed from cart" });
}

module.exports = { getCart, addToCart, updateCartItem, removeCartItem };
