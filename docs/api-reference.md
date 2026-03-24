# API Reference

Base URL: `/api/v1`

## Authentication

### `POST /auth/register`
- Creates a customer account for a store.
- Body: `email`, `password`, `firstName`, `lastName`, `storeSlug`, `country`, `currency`, `preferredLanguage`

### `POST /auth/login`
- Authenticates with email, phone, or username plus password.

### `POST /auth/password/request-otp`
- Sends an OTP to the account email or phone for password reset.
- Body: `identifier`

### `POST /auth/password/reset`
- Resets the password using the OTP flow.
- Body: `identifier`, `otp`, `newPassword`

### `POST /auth/username/request-otp`
- Sends an OTP to an email or phone number to recover a username.
- Body: `destination`, `destinationType`

### `POST /auth/username/recover`
- Validates the OTP and returns the username tied to that email or phone number.
- Body: `destination`, `destinationType`, `otp`

### `POST /auth/refresh`
- Exchanges a refresh token for a new access token pair.

### `GET /auth/me`
- Returns the authenticated profile.

## Storefront

### `GET /stores`
- Lists active stores for region/store selection.

### `GET /products`
- Query params: `storeKey`, `category`, `search`, `featured`, `currency`

### `GET /products/:productId`
- Returns full product detail plus aggregated review summary.

### `GET /reviews`
- Query params: `productId`

### `POST /reviews`
- Auth required. Creates a review and sets `verifiedPurchase` when matching paid orders exist.

## Cart and Checkout

### `GET /cart`
- Auth required. Returns the active cart.

### `POST /cart/items`
- Auth required. Adds or increments a cart item.

### `GET /orders/checkout-summary`
- Auth required. Returns subtotal, shipping, discount, tax, and total.

### `POST /orders`
- Auth required. Places an order, creates payment intent metadata, and dispatches suppliers.

### `GET /orders`
- Auth required. Customers receive their own orders; admins receive store orders.

### `GET /orders/:orderId/track`
- Auth required. Returns tracking events and updates guarantee eligibility when overdue.

### `POST /payments/webhooks/stripe`
- Stripe-signed raw webhook endpoint. Updates order payment state from verified Stripe events.

### `POST /payments/webhooks/paypal`
- PayPal-verified webhook endpoint. Requires `PAYPAL_WEBHOOK_ID` plus PayPal API credentials.

### `POST /payments/webhooks/payfast`
- Secure callback endpoint for PayFast. Requires `x-payfast-secret` to match `PAYFAST_WEBHOOK_SECRET`.

### `POST /payments/webhooks/ozow`
- Secure callback endpoint for Ozow. Requires `x-ozow-secret` to match `OZOW_WEBHOOK_SECRET`.

## Suppliers and Admin

### `GET /suppliers`
- Admin required. Lists store suppliers.

### `POST /suppliers`
- Admin required. Creates a supplier integration.

### `GET /admin/dashboard`
- Admin required. Revenue, order, product, user, supplier counts, and top-selling products.

## AI and Notifications

### `POST /ai/assistant`
- Store context required. General product guidance.

### `POST /ai/assistant/personalized`
- Auth required. Uses stored preference context plus request preferences.

### `POST /notifications`
- Admin required. Sends a push notification payload through the notification service.
