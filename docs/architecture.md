# Architecture Overview

## Monorepo

- `apps/mobile`: React Native Expo storefront app
- `apps/api`: Express API for commerce, tenants, suppliers, payments, and AI
- `docs`: architecture, schema, and operational setup

## Multi-Tenant Design

- `Store` is the tenant root.
- Commerce records (`Product`, `Order`, `Supplier`, `Discount`) carry `storeId`.
- Requests resolve tenancy from `x-store-id`, `x-store-key`, or authenticated user context.
- Each store can customize branding, locale support, shipping policy, and enabled payment providers.

## Core Service Boundaries

- Auth: JWT access tokens + refresh tokens stored per user session
- Catalog: products, search, filters, reviews, wishlists
- Checkout: cart summary, discounts, shipping estimates, payment intent creation
- Fulfillment: supplier dispatch via API, email, or manual workflow fallback
- AI: OpenAI-backed recommendation assistant with session preference context
- Admin: store-scoped analytics, product management, supplier management

## Security Notes

- `helmet`, rate limiting, request validation, parameter pollution protection, and Mongo sanitization are enabled
- Refresh tokens are stored server-side and should be rotated and hashed in the next hardening iteration
- HTTPS termination should be enforced at the load balancer or reverse proxy
- Sensitive secrets belong in a vault or managed secret store, not `.env` in production
