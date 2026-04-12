const express = require("express");
const { listProducts, getProduct, createProduct, updateProduct, deleteProduct } = require("../../controllers/product.controller");
const { authenticate, requireRole } = require("../../middleware/auth.middleware");
const { resolveStore } = require("../../middleware/store.middleware");
const { validateRequest } = require("../../middleware/validate.middleware");
const { asyncHandler } = require("../../utils/async-handler");
const { productCreateValidator, productQueryValidator } = require("../../validators/product.validator");

const productRouter = express.Router();

productRouter.get("/", resolveStore, productQueryValidator, validateRequest, asyncHandler(listProducts));
productRouter.get("/:productId", resolveStore, asyncHandler(getProduct));
productRouter.post(
  "/",
  authenticate,
  resolveStore,
  requireRole("admin", "super_admin"),
  productCreateValidator,
  validateRequest,
  asyncHandler(createProduct)
);
productRouter.put(
  "/:productId",
  authenticate,
  resolveStore,
  requireRole("admin", "super_admin"),
  asyncHandler(updateProduct)
);
productRouter.delete(
  "/:productId",
  authenticate,
  resolveStore,
  requireRole("admin", "super_admin"),
  asyncHandler(deleteProduct)
);

module.exports = { productRouter };
