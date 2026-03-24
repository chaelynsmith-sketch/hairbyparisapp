const { Supplier } = require("../models/supplier.model");

async function listSuppliers(req, res) {
  const suppliers = await Supplier.find({ storeId: req.storeId }).sort({ createdAt: -1 });
  res.json({ suppliers });
}

async function createSupplier(req, res) {
  const supplier = await Supplier.create({
    ...req.body,
    storeId: req.storeId
  });
  res.status(201).json({ supplier });
}

module.exports = { listSuppliers, createSupplier };
