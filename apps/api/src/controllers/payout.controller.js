const { Payout } = require("../models/payout.model");
const { ApiError } = require("../utils/api-error");

async function listPayouts(req, res) {
  const payouts = await Payout.find({ storeId: req.storeId }).sort({ createdAt: -1 }).limit(200);
  res.json({ payouts });
}

async function updatePayout(req, res) {
  const payout = await Payout.findOne({ _id: req.params.payoutId, storeId: req.storeId });

  if (!payout) {
    throw new ApiError(404, "Payout not found");
  }

  if (req.body.status) {
    payout.status = req.body.status;
    payout.paidAt = req.body.status === "paid" ? new Date() : payout.paidAt;
  }

  if (typeof req.body.notes === "string") {
    payout.notes = req.body.notes;
  }

  await payout.save();
  res.json({ payout });
}

module.exports = { listPayouts, updatePayout };
