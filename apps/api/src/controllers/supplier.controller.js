const { Supplier } = require("../models/supplier.model");
const { Product } = require("../models/product.model");
const { ApiError } = require("../utils/api-error");

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

async function deleteSupplier(req, res) {
  const supplier = await Supplier.findOneAndDelete({ _id: req.params.supplierId, storeId: req.storeId });

  if (!supplier) {
    throw new ApiError(404, "Supplier not found");
  }

  await Product.updateMany(
    { storeId: req.storeId, supplierId: supplier._id },
    {
      $unset: {
        supplierId: "",
        sourcing: ""
      }
    }
  );

  res.json({ message: `${supplier.name} deleted successfully`, supplierId: supplier.id });
}

module.exports = { listSuppliers, createSupplier, deleteSupplier };
