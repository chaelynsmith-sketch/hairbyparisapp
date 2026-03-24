const express = require("express");
const { listStores, createStore } = require("../../controllers/store.controller");
const { authenticate, requireRole } = require("../../middleware/auth.middleware");
const { asyncHandler } = require("../../utils/async-handler");

const storeRouter = express.Router();

storeRouter.get("/", asyncHandler(listStores));
storeRouter.post("/", authenticate, requireRole("admin", "super_admin"), asyncHandler(createStore));

module.exports = { storeRouter };
