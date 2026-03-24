const { logger } = require("../config/logger");

function notFoundHandler(req, res) {
  res.status(404).json({
    message: `Route not found: ${req.originalUrl}`
  });
}

function errorHandler(error, req, res, _next) {
  const status = error.statusCode || 500;
  const requestLogger = req.log || logger;

  requestLogger.error(
    {
      statusCode: status,
      requestId: req.requestId,
      details: error.details || null,
      errorName: error.name
    },
    error.message || "Unhandled server error"
  );

  res.status(status).json({
    message: error.message || "Internal server error",
    details: error.details || null,
    requestId: req.requestId || null
  });
}

module.exports = { notFoundHandler, errorHandler };
