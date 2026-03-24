const jwt = require("jsonwebtoken");

function signAccessToken(user) {
  return jwt.sign(
    {
      role: user.role,
      storeId: user.storeId
    },
    process.env.JWT_ACCESS_SECRET,
    {
      subject: user.id,
      expiresIn: process.env.JWT_ACCESS_TTL || "15m"
    }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    {
      type: "refresh"
    },
    process.env.JWT_REFRESH_SECRET,
    {
      subject: user.id,
      expiresIn: process.env.JWT_REFRESH_TTL || "30d"
    }
  );
}

module.exports = { signAccessToken, signRefreshToken };
