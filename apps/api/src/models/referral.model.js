const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
  {
    referrerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    referredUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    code: { type: String, required: true, index: true },
    rewardStatus: { type: String, enum: ["pending", "earned", "redeemed"], default: "pending" }
  },
  { timestamps: true }
);

const Referral = mongoose.model("Referral", referralSchema);

module.exports = { Referral };
