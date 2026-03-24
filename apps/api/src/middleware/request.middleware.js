const crypto = require("crypto");
const { logger } = require("../config/logger");

function requestContext(req, res, next) {
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  const startTime = Date.now();
  req.log = logger.child({ requestId, method: req.method, path: req.originalUrl });

  res.on("finish", () => {
    const durationMs = Date.now() - startTime;
    req.log.info(
      {
        statusCode: res.statusCode,
        durationMs,
        userId: req.user?.id || null,
        storeId: req.storeId || null
      },
      "request completed"
    );
  });

  next();
}

module.exports = { requestContext };
