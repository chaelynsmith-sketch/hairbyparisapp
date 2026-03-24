const multer = require("multer");
const { ApiError } = require("../utils/api-error");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/") && !file.mimetype.startsWith("video/")) {
      return cb(new ApiError(400, "Only image and video uploads are supported"));
    }

    return cb(null, true);
  }
});

module.exports = { upload };
