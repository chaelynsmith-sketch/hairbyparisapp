const { UploadAsset } = require("../models/upload-asset.model");
async function serveUploadAsset(req, res, next) {
  const key = req.params[0];
  const asset = await UploadAsset.findOne({ key });

  if (!asset) {
    return next();
  }

  res.setHeader("Content-Type", asset.contentType);
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.send(asset.data);
}

module.exports = { serveUploadAsset };
