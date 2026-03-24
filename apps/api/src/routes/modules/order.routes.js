const express = require("express");
const { getCheckoutSummary, createOrder, listOrders, trackOrder, adminUpdateOrder } = require("../../controllers/order.controller");
const { authenticate, requireRole } = require("../../middleware/auth.middleware");
const { resolveStore } = require("../../middleware/store.middleware");
const { asyncHandler } = require("../../utils/async-handler");
const { validateRequest } = require("../../middleware/validate.middleware");
const { createOrderValidator, checkoutSummaryValidator, adminUpdateOrderValidator } = require("../../validators/order.validator");

const orderRouter = express.Router();

orderRouter.use(authenticate, resolveStore);
orderRouter.get("/checkout-summary", checkoutSummaryValidator, validateRequest, asyncHandler(getCheckoutSummary));
orderRouter.post("/", createOrderValidator, validateRequest, asyncHandler(createOrder));
orderRouter.get("/", asyncHandler(listOrders));
orderRouter.get("/:orderId/track", asyncHandler(trackOrder));
orderRouter.patch("/:orderId", requireRole("admin", "super_admin"), adminUpdateOrderValidator, validateRequest, asyncHandler(adminUpdateOrder));

module.exports = { orderRouter };
