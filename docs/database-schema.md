# Database Schema Design

## Collections

### `stores`
- Tenant metadata, branding, currencies, enabled locales, shipping and payment settings

### `users`
- Identity, role, addresses, wishlist, loyalty points, session refresh tokens, chatbot preference context

### `products`
- Store-scoped catalog entries with media, inventory, pricing, product attributes, and recommendation metadata

### `reviews`
- Ratings, review text, media uploads, and verified purchase linkage

### `carts`
- Per-user active basket with item snapshots and coupon code

### `orders`
- Immutable order line items, payment state, supplier dispatch status, tracking, and shipping guarantee state

### `suppliers`
- Dropship partner integration details, lead times, sync settings, and manual fallback metadata

### `discounts`
- Coupon definitions with fixed/percentage discount logic

### `referrals`
- Affiliate/referral lifecycle and reward redemption state

## Indexing Strategy

- `stores.slug`: unique lookup for tenant routing
- `users.email`: unique auth lookup
- `products`: text index on `name`, compound unique on `storeId + slug`
- `orders.orderNumber`: unique order resolution
- `discounts`: compound unique on `storeId + code`

## Scaling Notes

- Shard by `storeId` for high-volume tenants when required
- Move refresh tokens into a dedicated session collection or Redis for large concurrency
- Split analytics into read models or warehouse sync when order volume grows
