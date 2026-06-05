const mongoose = require("mongoose");
const { logger } = require("./logger");

function describeMongoUri(uri) {
  if (!uri) {
    return { configured: false };
  }

  try {
    const parsed = new URL(uri);
    return {
      configured: true,
      protocol: parsed.protocol.replace(":", ""),
      username: parsed.username || "(missing)",
      host: parsed.host,
      database: parsed.pathname.replace("/", "") || "(none)"
    };
  } catch (_error) {
    return { configured: true, invalid: true };
  }
}

async function connectDatabase() {
  mongoose.set("strictQuery", true);
  logger.info({ mongodb: describeMongoUri(process.env.MONGODB_URI) }, "Connecting to MongoDB");
  await mongoose.connect(process.env.MONGODB_URI);
}

module.exports = { connectDatabase };
