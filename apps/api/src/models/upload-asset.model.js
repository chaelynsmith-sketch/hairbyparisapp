const mongoose = require("mongoose");

const uploadAssetSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    contentType: { type: String, required: true },
    data: { type: Buffer, required: true }
  },
  { timestamps: true }
);

const UploadAsset = mongoose.model("UploadAsset", uploadAssetSchema);

module.exports = { UploadAsset };
