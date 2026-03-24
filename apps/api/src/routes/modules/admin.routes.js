const express = require("express");
const { dashboardSummary } = require("../../controllers/admin.controller");
const { authenticate, requireRole } = require("../../middleware/auth.middleware");
const { resolveStore } = require("../../middleware/store.middleware");
const { asyncHandler } = require("../../utils/async-handler");

const adminRouter = express.Router();

adminRouter.use(authenticate, resolveStore, requireRole("admin", "super_admin"));
adminRouter.get("/dashboard", asyncHandler(dashboardSummary));

module.exports = { adminRouter };
