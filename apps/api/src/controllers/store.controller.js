const { Store } = require("../models/store.model");

async function listStores(_req, res) {
  const stores = await Store.find({ isActive: true }).sort({ createdAt: -1 });
  res.json({ stores });
}

async function createStore(req, res) {
  const store = await Store.create(req.body);
  res.status(201).json({ store });
}

module.exports = { listStores, createStore };
