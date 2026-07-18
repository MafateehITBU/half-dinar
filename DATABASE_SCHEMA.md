# Database Schema — Abu Al-Nas

PostgreSQL 15+. ORM: Prisma. All monetary values: `DECIMAL(12,3)` JOD.

---

## RBAC

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| email | VARCHAR UNIQUE | |
| password_hash | VARCHAR | |
| first_name, last_name | VARCHAR | |
| phone | VARCHAR | |
| locale | ENUM ar, en | default `ar` |
| email_verified_at | TIMESTAMPTZ | |
| age_confirmed | BOOLEAN | 13+ |
| referral_code | VARCHAR UNIQUE | generated |
| referred_by_user_id | UUID FK nullable | |
| is_active | BOOLEAN | |
| created_at, updated_at | TIMESTAMPTZ | |

### `roles` / `permissions` / `role_permissions` / `user_roles`
Standard many-to-many RBAC. Seed: Super Admin, Admin, Manage Product, Sales, Insights.

---

## Catalog

### `categories`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| parent_id | UUID FK self nullable | nested |
| slug | VARCHAR UNIQUE | |
| name_ar, name_en | VARCHAR | |
| description_ar, description_en | TEXT | |
| image_url | VARCHAR | |
| sort_order | INT | |
| is_active | BOOLEAN | |

### `products`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| sku | VARCHAR UNIQUE | one per product |
| slug | VARCHAR UNIQUE | |
| name_ar, name_en | VARCHAR | |
| description_ar, description_en | TEXT | |
| price | DECIMAL | tax-inclusive |
| compare_at_price | DECIMAL nullable | was price |
| category_id | UUID FK | |
| stock_quantity | INT | global stock |
| low_stock_threshold | INT nullable | falls back to settings |
| is_active | BOOLEAN | |
| is_featured | BOOLEAN | best sellers |
| meta_title_ar/en | VARCHAR | SEO |
| meta_description_ar/en | TEXT | |
| avg_rating | DECIMAL | denormalized |
| review_count | INT | |
| sold_count | INT | popularity |
| created_at, updated_at | TIMESTAMPTZ | |

### `product_images`
product_id, url, cloudinary_public_id, sort_order, alt_ar, alt_en

### `tags` / `product_tags`
tags: slug, name_ar, name_en — product_tags: M2M

### `product_relations`
product_id, related_product_id (symmetric or one-way)

---

## Packages

### `packages`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| slug, name_ar/en, description_ar/en | | |
| image_url | VARCHAR | own image |
| price | DECIMAL | must be < sum(items) |
| is_active | BOOLEAN | |

### `package_items`
package_id, product_id, quantity

---

## Inventory

### `inventory_history`
product_id, change_qty, reason (sale, adjustment, refund, restock), reference_id, admin_user_id, created_at

### `stock_movements`
Alias view or same table for reporting exports

---

## Cart & Orders

### `carts` / `cart_items`
user_id nullable, guest_token nullable, cart_items: product_id, quantity, unit_price snapshot

### `orders`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| order_number | VARCHAR UNIQUE | human-readable |
| user_id | UUID FK | required |
| status | ENUM | pending, processing, paid, shipped, delivered, completed, cancelled, refunded |
| subtotal, shipping_amount, discount_amount, total | DECIMAL | |
| coupon_id | UUID FK nullable | |
| shipping_zone_id | UUID FK | |
| payment_method | ENUM cod, stripe | |
| payment_status | ENUM | |
| stripe_payment_intent_id | VARCHAR nullable | |
| loyalty_points_used | INT | |
| loyalty_points_earned | INT | |
| referral_code_used | VARCHAR nullable | |
| notes | TEXT | |
| created_at, updated_at | TIMESTAMPTZ | |

### `order_items`
order_id, product_id nullable, package_id nullable, name snapshot, sku, qty, unit_price, total

### `order_status_history`
order_id, from_status, to_status, note, created_by (system|user id), created_at

### `addresses`
user_id, label, governorate, city, street, building, phone, is_default

---

## Shipping

### `shipping_zones`
name_ar/en, governorate_code, is_active

### `shipping_rates`
zone_id, flat_rate DECIMAL

### `settings` (key-value or single row)
free_shipping_threshold, default_low_stock_threshold, loyalty_earn_rate, referral_bonus, etc.

---

## Promotions

### `coupons`
code, type (percent|fixed|free_shipping), value, starts_at, ends_at, usage_limit, used_count, per_user_limit, min_order_value, is_active

### `coupon_restrictions`
coupon_id, restriction_type (product|category), restriction_id

### `campaigns`
name, type (flash|seasonal|holiday), starts_at, ends_at, is_active

### `campaign_products`
campaign_id, product_id, discount_percent or sale_price

---

## Loyalty & Referral

### `loyalty_accounts`
user_id, points_balance

### `loyalty_transactions`
account_id, type (earn|redeem|adjust), points, order_id nullable, description

### `referrals`
referrer_id, referee_id, order_id, status, reward_granted_at

---

## Reviews & Social

### `reviews`
product_id, user_id, order_id, rating 1-5, title, body, status (pending|approved|rejected), created_at

### `review_images`
review_id, url

### `wishlists` / `wishlist_items`
user_id + guest merge on login

### `compare_sessions`
user_id or guest_token, product_ids JSON array max 4

---

## Refunds

### `refund_requests`
order_id, user_id, reason, status, admin_notes, created_at

### `refund_evidence`
refund_request_id, image_url, uploaded_at

---

## CMS & Content

### `hero_slides`
image, title_ar/en, subtitle, cta_text, cta_link, sort_order, starts_at, ends_at, is_active

### `cms_sections`
key (home_categories, flash_offers, etc.), payload JSONB, is_active

### `cms_pages`
slug, title_ar/en, body_ar/en, type (about|terms|privacy|refund|custom)

### `faqs`
question_ar/en, answer_ar/en, sort_order (shown on contact)

### `blog_posts`
slug, title_ar/en, excerpt, body_ar/en, cover_image, published_at, is_published

### `newsletter_subscribers`
email, consents (newsletter, offers), subscribed_at

---

## Notifications & Audit

### `notifications`
user_id, channel, title, body, read_at, created_at (in-app future)

### `audit_logs`
user_id, action, entity_type, entity_id, metadata JSONB, ip, created_at

---

## Auth tokens

### `refresh_tokens`
user_id, token_hash, expires_at, revoked_at

### `email_verification_tokens` / `password_reset_tokens`
standard

---

## Indexes (critical)

- `products(category_id, is_active)`
- `products(sku)`
- `orders(user_id, created_at DESC)`
- `orders(order_number)`
- `order_status_history(order_id)`
- `reviews(product_id, status)`
- Full-text: delegated to Meilisearch

---

## Meilisearch Index `products`

```json
{
  "id": "uuid",
  "sku": "string",
  "name_ar": "string",
  "name_en": "string",
  "description_ar": "string",
  "tags": ["string"],
  "category_id": "uuid",
  "category_path": "string",
  "price": 0.0,
  "in_stock": true,
  "rating": 4.5,
  "image": "url"
}
```

Facets: category_id, tags, in_stock, price (numeric filter).
