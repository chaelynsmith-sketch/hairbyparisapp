const pino = require("pino");

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.body.password",
      "req.body.passwordHash",
      "req.body.refreshToken",
      "req.body.apiKey",
      "headers.authorization",
      "headers.cookie",
      "authorization",
      "cookie"
    ],
    censor: "[redacted]"
  }
});

module.exports = { logger };
