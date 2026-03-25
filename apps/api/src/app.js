const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const { paymentWebhookRouter } = require("./routes/modules/payment.routes");
const { apiRouter } = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/error.middleware");
const { requestContext } = require("./middleware/request.middleware");

function createApp() {
  const app = express();
  const configuredOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedVercelProjectPattern = /^https:\/\/hairbyparisapp-api(?:-[a-z0-9-]+)?\.vercel\.app$/i;

  const allowOrigin = (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    const isConfigured = configuredOrigins.includes(origin);
    const isExpoLocalhost = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
    const isApprovedVercelPreview = allowedVercelProjectPattern.test(origin);

    if (isConfigured || isApprovedVercelPreview || (process.env.NODE_ENV !== "production" && isExpoLocalhost)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  };

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }
    })
  );
  app.use(
    cors({
      origin: allowOrigin,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-store-key", "x-store-id"]
    })
  );
  app.use(compression());
  app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
  app.use("/api/v1/payments/webhooks", paymentWebhookRouter);
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(mongoSanitize());
  app.use(hpp());
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false
    })
  );
  app.use(requestContext);

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "hair-by-paris-api",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString()
    });
  });

  app.use("/api/v1", apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
