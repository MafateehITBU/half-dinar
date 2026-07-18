# API Documentation — Abu Al-Nas

**Base URL:** `{API_HOST}/api/v1`  
**Auth header:** `Authorization: Bearer {accessToken}`  
**Language:** `Accept-Language: ar` (default) or `en`

> **Swagger UI (dev):** `http://localhost:4000/api/docs`  
> **OpenAPI spec:** `apps/api/src/openapi/openapi.json`  
> **Postman:** `docs/postman/abou-al-nas.postman_collection.json`

---

## Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register (age_confirmed required) |
| POST | `/auth/login` | Login → access + refresh |
| POST | `/auth/logout` | Revoke refresh |
| POST | `/auth/refresh` | New access token |
| POST | `/auth/verify-email` | Confirm email token |
| POST | `/auth/forgot-password` | Send reset email |
| POST | `/auth/reset-password` | Reset with token |

### Register example

```bash
curl -X POST "$API/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "أحمد",
    "lastName": "محمد",
    "phone": "+962790000000",
    "ageConfirmed": true,
    "locale": "ar"
  }'
```

---

## Public catalog

| Method | Path | Description |
|--------|------|-------------|
| GET | `/categories` | Tree (nested) |
| GET | `/categories/:slug` | Category + product count |
| GET | `/products` | List (pagination, filters via query) |
| GET | `/products/:slug` | Detail + related |
| GET | `/packages` | Active packages |
| GET | `/packages/:slug` | Package + items + savings |
| GET | `/search` | Meilisearch query |
| GET | `/search/suggest` | Predictive |
| GET | `/tags` | All tags |

**Product list query params:** `category`, `tags`, `minPrice`, `maxPrice`, `inStock`, `sort` (newest|popularity|bestSeller|priceAsc|priceDesc|rating), `page`, `limit`

---

## Cart (guest + user)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/cart` | Current cart (cookie `cartToken` or auth) |
| POST | `/cart/items` | Add line `{ productId, quantity }` |
| PATCH | `/cart/items/:id` | Update qty |
| DELETE | `/cart/items/:id` | Remove line |
| POST | `/cart/merge` | Merge guest → user (after login) |

---

## Checkout (auth required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/checkout/shipping-options` | Zones + rates for address |
| POST | `/checkout/validate-coupon` | Single coupon, no stack |
| POST | `/checkout/quote` | Totals preview |
| POST | `/checkout/place-order` | Create order (COD or Stripe client secret) |
| POST | `/checkout/stripe/confirm` | Webhook-driven or client confirm |

---

## Orders (customer)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/orders` | My orders |
| GET | `/orders/:id` | Detail + timeline |
| GET | `/orders/:id/invoice` | HTML invoice (Arabic RTL, print to PDF) |
| GET | `/orders/:id/invoice.pdf` | PDF download |
| POST | `/refunds` | Refund request + evidence URLs |

---

## Users (customer)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users/me` | Profile, addresses, loyalty balance |
| PATCH | `/users/me` | Update name, phone, locale |

---

## Reviews, wishlist, compare

| Method | Path | Description |
|--------|------|-------------|
| GET | `/products/:id/reviews` | Approved only |
| POST | `/products/:id/reviews` | Verified purchase |
| GET | `/wishlist` | |
| POST | `/wishlist/items` | |
| GET | `/compare` | |
| POST | `/compare/items` | Max 4 |

---

## Loyalty & referral

| Method | Path | Description |
|--------|------|-------------|
| GET | `/loyalty/balance` | |
| GET | `/loyalty/history` | |
| GET | `/referral/code` | My code |
| POST | `/referral/apply` | Apply at registration/checkout |

---

## CMS (public)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/cms/home` | Hero + sections |
| GET | `/cms/pages/:slug` | Static pages |
| GET | `/cms/contact` | Contact info + FAQs |
| GET | `/blog` | Paginated posts |
| GET | `/blog/:slug` | Post detail |
| POST | `/newsletter/subscribe` | `{ email, newsletter, offers }` |

---

## Admin (`/admin/*` — permission gated)

| Area | Paths |
|------|-------|
| Products | CRUD, bulk import/export |
| Categories | CRUD tree |
| Packages | CRUD |
| Inventory | adjust, history |
| Orders | list, update status, timeline |
| Promotions | coupons, campaigns |
| CMS | slides, sections, pages, blog |
| Users | list, assign roles |
| Refunds | review approve/reject |
| Analytics | dashboard metrics |
| Audit | logs + export |
| Settings | shipping, loyalty, thresholds |

---

## Webhooks

| Method | Path | Description |
|--------|------|-------------|
| POST | `/webhooks/stripe` | Stripe events |

---

## Health

| Method | Path |
|--------|------|
| GET | `/health` |

---

## Standard error shape

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "رسالة بالعربية أو English",
    "details": []
  }
}
```

---

## Status codes

- `200` OK  
- `201` Created  
- `400` Validation  
- `401` Unauthorized (checkout without login)  
- `403` Forbidden (RBAC)  
- `404` Not found  
- `409` Conflict (stock, coupon)  
- `429` Rate limited  
- `500` Server error  
