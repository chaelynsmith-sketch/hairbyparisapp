const express = require("express");
const { getCart, addToCart, updateCartItem, removeCartItem } = require("../../controllers/cart.controller");
const { authenticate } = require("../../middleware/auth.middleware");
const { resolveStore } = require("../../middleware/store.middleware");
const { asyncHandler } = require("../../utils/async-handler");

const cartRouter = express.Router();

cartRouter.use(authenticate, resolveStore);
cartRouter.get("/", asyncHandler(getCart));
cartRouter.post("/items", asyncHandler(addToCart));
cartRouter.patch("/items/:productId", asyncHandler(updateCartItem));
cartRouter.delete("/items/:productId", asyncHandler(removeCartItem));

module.exports = { cartRouter };
