const express = require("express");
const { listPayouts, updatePayout } = require("../../controllers/payout.controller");
const { authenticate, requireRole } = require("../../middleware/auth.middleware");
const { resolveStore } = require("../../middleware/store.middleware");
const { asyncHandler } = require("../../utils/async-handler");

const payoutRouter = express.Router();

payoutRouter.use(authenticate, resolveStore, requireRole("admin", "super_admin"));
payoutRouter.get("/", asyncHandler(listPayouts));
payoutRouter.patch("/:payoutId", asyncHandler(updatePayout));

module.exports = { payoutRouter };
