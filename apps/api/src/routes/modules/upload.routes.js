const express = require("express");
const { uploadMedia } = require("../../controllers/upload.controller");
const { authenticate, requireRole } = require("../../middleware/auth.middleware");
const { resolveStore } = require("../../middleware/store.middleware");
const { upload } = require("../../middleware/upload.middleware");
const { asyncHandler } = require("../../utils/async-handler");

const uploadRouter = express.Router();

uploadRouter.post(
  "/product-media",
  authenticate,
  resolveStore,
  requireRole("admin", "super_admin"),
  upload.single("file"),
  asyncHandler(uploadMedia)
);

uploadRouter.post(
  "/review-media",
  authenticate,
  resolveStore,
  upload.single("file"),
  asyncHandler(uploadMedia)
);

module.exports = { uploadRouter };
