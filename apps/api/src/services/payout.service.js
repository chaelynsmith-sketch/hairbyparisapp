const { Payout } = require("../models/payout.model");
const { Supplier } = require("../models/supplier.model");

function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

async function createPayoutsForOrder(order) {
  const existingPayouts = await Payout.find({ orderId: order.id });
  if (existingPayouts.length) {
    return existingPayouts;
  }

  const supplierIds = order.items.map((item) => item.supplierId).filter(Boolean);
  const suppliers = await Supplier.find({ _id: { $in: supplierIds } });
  const supplierMap = new Map(suppliers.map((supplier) => [supplier.id, supplier]));
  const supplierTotals = new Map();
  let unassignedTotal = 0;

  for (const item of order.items) {
    const lineTotal = roundMoney(item.unitPrice * item.quantity);
    if (!item.supplierId) {
      unassignedTotal += lineTotal;
      continue;
    }

    const supplier = supplierMap.get(item.supplierId.toString());
    const variantSupplierCost = Number(item.supplierCost || 0);
    const fixedAmount = variantSupplierCost || Number(supplier?.payoutConfig?.fixedAmount || 0);
    const payoutRate = Number(supplier?.payoutConfig?.payoutRatePercentage ?? 70);
    const supplierAmount = fixedAmount > 0
      ? roundMoney(Math.min(fixedAmount * item.quantity, lineTotal))
      : roundMoney(lineTotal * (payoutRate / 100));
    supplierTotals.set(
      item.supplierId.toString(),
      roundMoney((supplierTotals.get(item.supplierId.toString()) || 0) + supplierAmount)
    );
  }

  const payouts = [];
  let allocatedSupplierAmount = 0;

  for (const [supplierId, amount] of supplierTotals.entries()) {
    const supplier = supplierMap.get(supplierId);
    allocatedSupplierAmount += amount;
    payouts.push({
      storeId: order.storeId,
      orderId: order.id,
      supplierId,
      recipientType: "supplier",
      recipientName: supplier?.name || "Supplier",
      amount,
      currency: order.totals.currency,
      method: supplier?.payoutConfig?.method || "manual_transfer",
      destinationLabel: supplier?.payoutConfig?.destinationLabel || "",
      notes: `Supplier payout for order ${order.orderNumber}`
    });
  }

  const adminAmount = roundMoney(order.totals.grandTotal - allocatedSupplierAmount);
  payouts.push({
    storeId: order.storeId,
    orderId: order.id,
    recipientType: "admin",
    recipientName: "Hair By Paris Admin",
    amount: adminAmount < 0 ? 0 : adminAmount + unassignedTotal,
    currency: order.totals.currency,
    method: "store_settlement",
    destinationLabel: "Admin operating account",
    notes: `Admin settlement for order ${order.orderNumber}`
  });

  return Payout.insertMany(payouts);
}

async function syncPayoutsForPaymentStatus(order, paymentStatus) {
  if (paymentStatus === "paid") {
    return createPayoutsForOrder(order);
  }

  if (paymentStatus === "failed" || paymentStatus === "cancelled" || paymentStatus === "refunded") {
    await Payout.updateMany(
      { orderId: order.id, status: "pending" },
      { $set: { status: "cancelled", notes: `Payout cancelled after ${paymentStatus} payment status.` } }
    );
  }

  return [];
}

module.exports = { createPayoutsForOrder, syncPayoutsForPaymentStatus };
