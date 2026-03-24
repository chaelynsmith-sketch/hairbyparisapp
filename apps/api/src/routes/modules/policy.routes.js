const express = require("express");
const { getPolicyPage, upsertPolicyPage } = require("../../controllers/policy.controller");
const { authenticate, requireRole } = require("../../middleware/auth.middleware");
const { asyncHandler } = require("../../utils/async-handler");

const policyRouter = express.Router();

policyRouter.get("/:policyKey", asyncHandler(getPolicyPage));
policyRouter.put("/:policyKey", authenticate, requireRole("admin", "super_admin"), asyncHandler(upsertPolicyPage));

module.exports = { policyRouter };
