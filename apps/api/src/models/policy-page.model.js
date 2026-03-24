const mongoose = require("mongoose");

const policySectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true }
  },
  { _id: false }
);

const policyPageSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      enum: ["privacy", "terms", "refunds"],
      unique: true,
      required: true
    },
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    sections: { type: [policySectionSchema], default: [] }
  },
  { timestamps: true }
);

const PolicyPage = mongoose.model("PolicyPage", policyPageSchema);

module.exports = { PolicyPage };
