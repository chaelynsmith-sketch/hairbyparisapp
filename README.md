# Hair By Paris Commerce Platform

Production-oriented monorepo for a multi-tenant mobile commerce platform selling hair products, extensions, wigs, and beauty tools.

## Structure

- `apps/mobile`: Expo React Native client
- `apps/api`: Node.js + Express API
- `docs`: setup guide, architecture, schema, and API reference

## Delivered Scope

- Multi-tenant store architecture with region, currency, locale, and payment configuration
- JWT auth, profiles, addresses, wishlists, loyalty points, and referral-ready schema
- Product catalog, reviews, cart, checkout, orders, tracking, supplier dispatch, and guarantee logic
- OpenAI-backed assistant endpoints and in-app mobile chat UI
- Admin analytics endpoint plus mobile admin dashboard route

## Setup

1. Install dependencies from the repository root with `npm install`
2. Copy `apps/api/.env.example` to `apps/api/.env`
3. Copy `apps/mobile/.env.example` to `apps/mobile/.env`
4. Start the API with `npm run dev:api`
5. Start the Expo app with `npm run dev:mobile`

See [setup-guide](./docs/setup-guide.md), [architecture](./docs/architecture.md), [database-schema](./docs/database-schema.md), and [api-reference](./docs/api-reference.md) for implementation details.
