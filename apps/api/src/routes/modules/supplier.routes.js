const express = require("express");
const { listSuppliers, createSupplier, deleteSupplier } = require("../../controllers/supplier.controller");
const { authenticate, requireRole } = require("../../middleware/auth.middleware");
const { resolveStore } = require("../../middleware/store.middleware");
const { asyncHandler } = require("../../utils/async-handler");

const supplierRouter = express.Router();

supplierRouter.use(authenticate, resolveStore, requireRole("admin", "super_admin"));
supplierRouter.get("/", asyncHandler(listSuppliers));
supplierRouter.post("/", asyncHandler(createSupplier));
supplierRouter.delete("/:supplierId", asyncHandler(deleteSupplier));

module.exports = { supplierRouter };
