const express = require("express");
const { askAssistant } = require("../../controllers/ai.controller");
const { resolveStore } = require("../../middleware/store.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const { asyncHandler } = require("../../utils/async-handler");

const aiRouter = express.Router();

aiRouter.post("/assistant", resolveStore, asyncHandler(askAssistant));
aiRouter.post("/assistant/personalized", authenticate, resolveStore, asyncHandler(askAssistant));

module.exports = { aiRouter };
