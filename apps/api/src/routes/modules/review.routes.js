const express = require("express");
const { listReviews, createReview } = require("../../controllers/review.controller");
const { authenticate } = require("../../middleware/auth.middleware");
const { resolveStore } = require("../../middleware/store.middleware");
const { asyncHandler } = require("../../utils/async-handler");

const reviewRouter = express.Router();

reviewRouter.get("/", asyncHandler(listReviews));
reviewRouter.post("/", authenticate, resolveStore, asyncHandler(createReview));

module.exports = { reviewRouter };
