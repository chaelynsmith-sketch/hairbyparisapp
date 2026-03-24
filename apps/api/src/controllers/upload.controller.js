const path = require("path");
const { uploadToS3 } = require("../services/storage.service");
const { ApiError } = require("../utils/api-error");

function sanitizeName(filename = "upload") {
  return filename.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase();
}

async function uploadMedia(req, res) {
  if (!req.file) {
    throw new ApiError(400, "A file upload is required");
  }

  const category = req.body.category || "general";
  const extension = path.extname(req.file.originalname || "") || ".bin";
  const baseName = sanitizeName(path.basename(req.file.originalname || "upload", extension));
  const key = `${req.storeId}/${category}/${Date.now()}-${baseName}${extension}`;

  const uploaded = await uploadToS3({
    key,
    body: req.file.buffer,
    contentType: req.file.mimetype
  });

  res.status(201).json({
    media: {
      url: uploaded.url,
      key: uploaded.key,
      type: req.file.mimetype.startsWith("video/") ? "video" : "image"
    }
  });
}

module.exports = { uploadMedia };
