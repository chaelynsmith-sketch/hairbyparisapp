const crypto = require("crypto");
const nodemailer = require("nodemailer");

const { logger } = require("../config/logger");
const { ApiError } = require("../utils/api-error");

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashOtp(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function getEmailTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendEmailOtp({ destination, purpose, code }) {
  const transporter = getEmailTransporter();

  if (!transporter) {
    logger.warn({ destination, purpose }, "SMTP not configured for OTP email delivery");
    return { delivered: false, channel: "email", reason: "smtp_not_configured", otp: code };
  }

  const purposeLabels = {
    password_reset: "password reset",
    username_recovery: "username recovery",
    email_verification: "email verification",
    phone_verification: "phone verification",
    login: "secure login"
  };
  const label = purposeLabels[purpose] || "verification";
  const subject = `Hair By Paris ${label} OTP`;
  const text = `Use this OTP for Hair By Paris ${label}: ${code}. It expires in 10 minutes.`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: destination,
    subject,
    text
  });

  return { delivered: true, channel: "email" };
}

async function sendSmsOtp({ destination, purpose, code }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !from) {
    logger.warn({ destination, purpose }, "Twilio not configured for OTP SMS delivery");
    return { delivered: false, channel: "sms", reason: "twilio_not_configured", otp: code };
  }

  const purposeLabels = {
    password_reset: "password reset",
    username_recovery: "username recovery",
    email_verification: "email verification",
    phone_verification: "phone verification",
    login: "secure login"
  };
  const body = `Hair By Paris ${purposeLabels[purpose] || "verification"} OTP: ${code}. Expires in 10 minutes.`;

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      To: destination,
      From: from,
      Body: body
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error({ destination, purpose, status: response.status, errorBody }, "Twilio OTP delivery failed");
    throw new ApiError(502, "Unable to send OTP by SMS");
  }

  return { delivered: true, channel: "sms" };
}

async function sendOtp({ destination, purpose, code }) {
  const isEmail = destination.includes("@");
  const delivery = isEmail
    ? await sendEmailOtp({ destination, purpose, code })
    : await sendSmsOtp({ destination, purpose, code });

  if (!delivery.delivered) {
    logger.info({ destination, purpose, code, channel: delivery.channel }, "OTP fallback preview generated");
  }

  return delivery;
}

module.exports = { generateOtp, hashOtp, sendOtp };
