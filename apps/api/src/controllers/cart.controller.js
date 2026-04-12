const { Cart } = require("../models/cart.model");
const { Product } = require("../models/product.model");
const { ApiError } = require("../utils/api-error");

function findVariant(product, variantId) {
  if (!variantId) {
    return null;
  }

  return (product.variants || []).find((variant) => variant.id === variantId || variant._id?.toString() === variantId);
}

function findCartItem(cart, itemKey, variantId) {
  return cart.items.find((item) => {
    const matchesItemId = item._id?.toString() === itemKey;
    const matchesProduct = item.productId.toString() === itemKey;
    const matchesVariant = (item.variantId || "") === (variantId || "");
    return matchesItemId || (matchesProduct && matchesVariant);
  });
}

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

  const variant = findVariant(product, req.body.variantId);
  if (req.body.variantId && !variant) {
    throw new ApiError(404, "Selected product option was not found");
  }

  const unitPrice = variant
    ? variant.salePrice || variant.price || product.pricing.saleAmount || product.pricing.amount
    : product.pricing.saleAmount || product.pricing.amount;
  const sku = variant?.sku || product.inventory.sku;
  const existingItem = cart.items.find(
    (item) => item.productId.toString() === req.body.productId && (item.variantId || "") === (req.body.variantId || "")
  );
  if (existingItem) {
    existingItem.quantity += req.body.quantity || 1;
  } else {
    cart.items.push({
      productId: product.id,
      variantId: variant?.id,
      variantLabel: variant?.label,
      sku,
      quantity: req.body.quantity || 1,
      unitPrice,
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

  const item = findCartItem(cart, req.params.productId, req.body.variantId);
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

  const nextItems = cart.items.filter((entry) => {
    const matchesItemId = entry._id?.toString() === req.params.productId;
    const matchesProduct = entry.productId.toString() === req.params.productId && (entry.variantId || "") === (req.query.variantId || "");
    return !(matchesItemId || matchesProduct);
  });
  if (nextItems.length === cart.items.length) {
    throw new ApiError(404, "Cart item not found");
  }

  cart.items = nextItems;
  await cart.save();
  await cart.populate("items.productId");
  res.json({ cart, message: "Item removed from cart" });
}

module.exports = { getCart, addToCart, updateCartItem, removeCartItem };
