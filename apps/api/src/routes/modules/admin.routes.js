const express = require("express");
const { dashboardSummary, listAdminProducts } = require("../../controllers/admin.controller");
const { authenticate, requireRole } = require("../../middleware/auth.middleware");
const { resolveStore } = require("../../middleware/store.middleware");
const { asyncHandler } = require("../../utils/async-handler");

const adminRouter = express.Router();

adminRouter.use(authenticate, resolveStore, requireRole("admin", "super_admin"));
adminRouter.get("/dashboard", asyncHandler(dashboardSummary));
adminRouter.get("/products", asyncHandler(listAdminProducts));

module.exports = { adminRouter };
