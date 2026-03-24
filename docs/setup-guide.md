# Setup Guide

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB 7+
- Expo Go or native simulator tooling

## 1. Install Dependencies

Run from the repository root:

```bash
npm install
```

## 2. Configure Environment Variables

- Copy `apps/api/.env.example` to `apps/api/.env`
- Copy `apps/mobile/.env.example` to `apps/mobile/.env`
- Fill in MongoDB, JWT, OpenAI, payment provider, storage, and messaging credentials
- For OTP delivery:
  - configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and optionally `SMTP_FROM` for email OTPs
  - configure `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` for SMS OTPs
  - if these are not configured in development, the API returns an `otpPreview` value so you can still test the reset flow

## 3. Start the API

```bash
npm run dev:api
```

## 4. Start the Mobile App

```bash
npm run dev:mobile
```

## 5. Seed Initial Tenant Data

Create at least one `Store` document before customer registration if you want explicit storefront routing. Recommended initial slug: `hair-by-paris-global`.

## Production Deployment Notes

- Put the API behind HTTPS with a managed reverse proxy
- Use MongoDB Atlas or a comparable managed replica set
- Store media in S3 or Firebase Storage
- Run background jobs for supplier retries, tracking sync, and guarantee audits
- Move payment webhooks to dedicated signed endpoints before launch
