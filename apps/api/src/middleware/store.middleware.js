const { Store } = require("../models/store.model");
const { ApiError } = require("../utils/api-error");
const { asyncHandler } = require("../utils/async-handler");

const resolveStore = asyncHandler(async (req, _res, next) => {
  const storeKey = req.headers["x-store-key"] || req.query.storeKey;
  const storeId = req.headers["x-store-id"] || req.storeId;

  let store = null;

  if (storeId) {
    store = await Store.findById(storeId);
  } else if (storeKey) {
    store = await Store.findOne({ slug: storeKey });
  }

  if (!store) {
    throw new ApiError(400, "Store context is required");
  }

  req.store = store;
  req.storeId = store.id;
  next();
});

module.exports = { resolveStore };
