const jwt = require("jsonwebtoken");
const { User } = require("../models/user.model");
const { ApiError } = require("../utils/api-error");
const { asyncHandler } = require("../utils/async-handler");

const authenticate = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    throw new ApiError(401, "Authentication required");
  }

  let payload;

  try {
    payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Access token expired");
    }

    throw new ApiError(401, "Invalid access token");
  }

  const user = await User.findById(payload.sub).select("-passwordHash -refreshTokens.token");

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  req.user = user;
  req.storeId = req.headers["x-store-id"] || user.storeId?.toString() || null;
  next();
});

function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, "Insufficient permissions"));
    }

    return next();
  };
}

module.exports = { authenticate, requireRole };
