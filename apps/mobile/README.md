# Mobile Setup

## Features

- Expo Router with bottom-tab storefront navigation
- Region selector influencing locale and currency
- Product catalog, product details, checkout summary, orders, and AI chat
- Light and dark beauty-themed design system
- React Query data layer and Zustand session store

## Setup

1. Copy `.env.example` to `.env`.
2. Install dependencies with `npm install`.
3. Run `npm run dev:mobile` from the repository root.
4. Set `EXPO_PUBLIC_API_URL` to your running API.

## Next Integrations

- Add Firebase Cloud Messaging registration in the provider layer.
- Add Stripe mobile payment sheet and PayPal deep link flow.
- Replace mock assets with brand assets in `apps/mobile/assets`.
