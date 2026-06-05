const { UploadAsset } = require("../models/upload-asset.model");
const mongoose = require("mongoose");

async function streamGridFsAsset(key, res) {
  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "uploads"
  });
  const files = await bucket.find({ filename: key }).sort({ uploadDate: -1 }).limit(1).toArray();

  if (!files.length) {
    return false;
  }

  const file = files[0];
  res.setHeader("Content-Type", file.contentType || "application/octet-stream");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

  await new Promise((resolve, reject) => {
    const stream = bucket.openDownloadStream(file._id);
    stream.once("error", reject);
    stream.once("end", resolve);
    stream.pipe(res);
  });

  return true;
}

async function serveUploadAsset(req, res, next) {
  const key = req.params[0];
  const asset = await UploadAsset.findOne({ key });

  if (!asset) {
    const didStream = await streamGridFsAsset(key, res);

    if (didStream) {
      return;
    }

    return next();
  }

  res.setHeader("Content-Type", asset.contentType);
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.send(asset.data);
}

module.exports = { serveUploadAsset };
