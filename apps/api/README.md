# API Setup

## Features

- Multi-tenant stores with region-specific branding and payment methods
- JWT authentication with refresh token rotation pattern
- Product catalog with reviews, wishlists, cart, checkout, suppliers, and AI assistant
- Delivery guarantee logic with compensation eligibility flagging
- Admin analytics endpoints for revenue and popular products

## Setup

1. Copy `.env.example` to `.env`.
2. Install dependencies with `npm install`.
3. Start MongoDB locally or update `MONGODB_URI`.
4. Run `npm run dev:api` from the repository root.

## API Surface

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
- `GET /api/v1/stores`
- `POST /api/v1/stores`
- `GET /api/v1/products`
- `GET /api/v1/products/:productId`
- `POST /api/v1/products`
- `GET /api/v1/cart`
- `POST /api/v1/cart/items`
- `GET /api/v1/orders/checkout-summary`
- `POST /api/v1/orders`
- `GET /api/v1/orders`
- `GET /api/v1/orders/:orderId/track`
- `GET /api/v1/reviews`
- `POST /api/v1/reviews`
- `GET /api/v1/suppliers`
- `POST /api/v1/suppliers`
- `POST /api/v1/ai/assistant`
- `POST /api/v1/ai/assistant/personalized`
- `GET /api/v1/admin/dashboard`
- `GET /api/v1/payments/methods`
- `POST /api/v1/notifications`

## Multi-Tenant Pattern

Every storefront request resolves a store via `x-store-id`, `x-store-key`, or authenticated user context. Product, order, supplier, and analytics queries are scoped by `storeId`.
