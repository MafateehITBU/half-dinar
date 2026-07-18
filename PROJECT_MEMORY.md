# PROJECT MEMORY — Abu Al-Nas (ابو النص) E-Commerce

> **Last updated:** 2026-07-18  
> **Repo:** `half-dinar`  
> **Status:** Phases 1–3 complete. Phase 4 in progress — VPS live at `abualnus.com` (HTTPS), GitHub Actions deploy ready; `admin`/`api` DNS + SSL pending.

Read this file first in every new session before touching the codebase.

---

## Business Summary

| Field | Value |
|-------|--------|
| Customer-facing brand | **Abu Al-Nas** (ابو النص) |
| Repo / working name | `half-dinar` |
| Business type | Daily use products (general retail) |
| Primary market | **Jordan** |
| Currency | **JOD** (single currency) |
| Tax | Prices **include** tax (no separate line at checkout unless display-only) |
| Languages | **Arabic (default)** + English, RTL for AR |
| Age restriction | 13+ |
| Refund window | **14 days** (manual admin approval, evidence required) |
| B2B | No |

---

## Architecture (Target)

```
half-dinar/
├── apps/
│   ├── api/              # Express + TypeScript REST API
│   ├── storefront/       # React + TS + Tailwind (customer site)
│   └── admin/            # React + TS + Tailwind (admin subdomain app)
├── packages/
│   └── shared/           # Types, validators, constants
├── docker/               # Compose: postgres, redis, meilisearch
└── docs/                 # Extended docs (mirrors root *.md)
```

**Deployment model:** Admin = **separate subdomain + separate build** (not `/admin` on storefront).  
**API:** Single backend serves both frontends. Versioned REST: `/api/v1/...`  
**OpenAPI:** Swagger UI on API in non-production.

---

## Technical Stack (Locked)

| Layer | Choice | Notes |
|-------|--------|-------|
| Backend | Node.js, Express, TypeScript | Clean architecture layers |
| DB | PostgreSQL | Source of truth |
| Cache / sessions | **Redis** (from day one) | Cart sessions, rate limits, hot data |
| Search | **Meilisearch** | Arabic + EN, facets, instant/predictive search; sync from PG |
| ORM | Prisma (recommended) | Migrations, type-safe |
| Images | **Multer** → **Cloudinary** | |
| Auth | JWT access + refresh, bcrypt | Account required at checkout |
| Email | **SMTP (Gmail)** | Transactional + newsletter |
| Payments | **COD** + **Stripe (test)** | Pluggable provider interface |
| Hosting | VPS, Certbot SSL | Domain TBD |
| Environments | dev, staging, production | CI/CD GitHub Actions — **later**; local dev now |
| Mobile API | REST designed for future app | No mobile app in v1 |

---

## Brand / UI Direction

- Logo: **TBD** (client will design from site colors)
- Tone: Modern, trustworthy local Jordan retailer
- **Proposed palette (v1):**
  - Primary: `#0D9488` (teal-600) — trust, freshness
  - Accent: `#F59E0B` (amber-500) — offers/CTAs
  - Neutral: `#0F172A` / `#F8FAFC` (slate dark/light)
  - Error/success: standard Tailwind semantic tokens
- Dark mode: **ready** (CSS variables + `class` strategy)
- Animation: **Framer Motion**
- Fonts: **Cairo** (AR) + **Inter** (EN) via Google Fonts

---

## Database Schema (Overview)

See `DATABASE_SCHEMA.md` for full detail. Core entities:

- **users**, **roles**, **permissions**, **user_roles** (RBAC, custom roles phase 2)
- **refresh_tokens**, **email_verification**, **password_reset**
- **categories** (nested: `parent_id`)
- **products**, **product_images**, **product_tags**, **tags**
- **product_relations** (related products)
- **inventory**, **inventory_history**, **stock_movements**
- **packages**, **package_items** (admin-composed bundles, own price/image)
- **carts**, **cart_items** (guest: token/redis; user: persisted)
- **orders**, **order_items**, **order_status_history** (timeline)
- **addresses**, **shipping_zones**, **shipping_rates**
- **promotions**, **coupons**, **coupon_rules**, **campaigns**
- **loyalty_accounts**, **loyalty_transactions**
- **referrals**, **referral_rewards**
- **reviews**, **review_images** (verified purchase, moderated)
- **wishlists**, **compare_lists**
- **refund_requests**, **refund_evidence** (images, admin workflow)
- **cms_pages**, **cms_sections**, **hero_slides**, **banners**, **faqs** (contact section)
- **blog_posts**
- **newsletter_subscribers**
- **audit_logs**
- **notifications** (in-app schema ready; email-only launch)
- **settings** (free shipping threshold, low stock default, etc.)

**Not in v1:** brands table, digital products, multi-warehouse, carrier APIs.

---

## API Endpoints (Overview)

Base: `https://api.{domain}/api/v1`  
See `API_DOCUMENTATION.md` when generated; OpenAPI in `apps/api`.

**Auth:** register, login, logout, refresh, verify-email, forgot/reset password  
**Users:** profile, addresses, payment methods (saved for Stripe later), wishlist, orders  
**Catalog:** categories, products, packages, search (`/search?q=`), tags  
**Cart:** guest + merge on login  
**Checkout:** shipping quote, apply coupon, place order  
**Orders:** list, detail, timeline, invoice PDF  
**Reviews:** CRUD (verified), moderation (admin)  
**Promotions:** validate coupon, list active campaigns/flash  
**Loyalty / Referral:** balance, redeem, referral code  
**CMS:** public pages/sections; admin CRUD  
**Admin:** products, inventory, orders, promotions, CMS, users/RBAC, analytics, bulk import/export, audit logs, refunds  

---

## Folder Structure (On Disk)

```
half-dinar/
├── apps/
│   ├── api/                 # Express API — auth, health (port 4000)
│   ├── storefront/          # React storefront (port 5173)
│   └── admin/               # React admin (port 5174)
├── packages/
│   └── shared/              # Constants, Zod validators, types
├── docker-compose.yml       # Postgres :5435, Redis :6379, Meilisearch :7700
├── PROJECT_MEMORY.md
└── ...
```

---

## Reusable Components (Planned)

**Storefront:** ProductCard, HeroSlider, CategoryMasonry, CartDrawer, CheckoutSteps, LocaleSwitcher, SEOHead, CompareBar, WishlistButton, FlashSaleBadge  
**Admin:** DataTable, PermissionGate, StatCard, BulkUpload, OrderTimeline, RefundReviewPanel  
**Shared:** Zod schemas, API client, i18n keys, currency/date formatters (JOD)

---

## Business Rules

1. **Products (v1):** Simple only — price, description, images, SKU, tags, related products. No variants.
2. **Stock:** Single global qty per product; decrement on paid/processing order; **no backorders**.
3. **Low stock:** Alert when qty ≤ configurable threshold (default in settings).
4. **Packages:** Admin composes products; package has own image/price; must be cheaper than sum of items.
5. **Checkout:** Browse/cart as guest; **login/signup required** to complete checkout.
6. **Shipping:** Jordan zones only; own fleet (no carrier API); **free shipping** when order subtotal ≥ admin threshold.
7. **Payments:** COD + Stripe test; manual refund approval with **evidence upload**.
8. **Coupons:** Percentage, fixed, free shipping — **no stacking** (one coupon per order).
9. **Campaigns:** Flash sales first; scheduled promotions supported in engine.
10. **Loyalty + Referral:** Required in v1 scope (points/rewards + referral codes).
11. **Reviews:** Verified purchase only; admin moderation; optional photos.
12. **Compare:** Enabled with sensible max (e.g. 4 products).
13. **Share:** WhatsApp deep links + standard social URLs.
14. **Newsletter:** Opt-in for newsletter + offers (consent tracked).
15. **CMS:** Homepage fully admin-managed; static pages editable; FAQ = small block on Contact; Blog linked from **footer** only.
16. **SEO:** Arabic-first; Product, Organization, BreadcrumbList JSON-LD; sitemap, robots.txt.
17. **Analytics:** GA4 + Meta Pixel + built-in admin Insights dashboard.
18. **Cookie consent:** Required banner.
19. **Order status:** Auto transitions where defined (e.g. paid → processing); timeline on every order.
20. **Audit:** Log sensitive admin actions; exportable.

---

## RBAC (Default Roles)

| Role | Scope |
|------|--------|
| Super Admin | Full system |
| Admin | Business management |
| Manage Product | Products, categories, packages, inventory |
| Sales | Orders, customers, promotions |
| Insights | Read-only analytics |

Custom roles: **Phase 2**.

---

## Completed Features

- [x] Discovery questionnaire answered
- [x] Architecture & schema documentation drafted
- [x] Monorepo scaffold (api, storefront, admin, shared)
- [x] Docker Compose (Postgres, Redis, Meilisearch)
- [x] Prisma schema + initial migration (`20260604092040_init`)
- [x] RBAC seed (6 roles, 24 permissions, default settings)
- [x] Super admin seed user
- [x] Auth API (register, login, logout, refresh, verify-email, forgot/reset password, /me)
- [x] Health check (DB + Redis)
- [x] Storefront scaffold (RTL, Tailwind, Framer Motion hero)
- [x] Admin scaffold (dashboard shell)
- [x] Categories + products API (CRUD, nested categories, filters, sort)
- [x] Meilisearch product index + search/suggest
- [x] Guest cart (Redis/cookie) + merge on login
- [x] Storefront: store, product detail, cart, login/register
- [x] Admin: login, categories, products, orders management
- [x] Checkout (multi-step), COD + Stripe, shipping zones (Jordan)
- [x] Orders with status timeline + admin status updates
- [x] Storefront: checkout, order success, order history
- [ ] Tests, CI/CD

### Stripe local dev
- `STRIPE_SECRET_KEY` — API `.env` (sk_test_...)
- `VITE_STRIPE_PUBLISHABLE_KEY` — storefront `.env` (pk_test_..., same Dashboard page)
- `STRIPE_WEBHOOK_SECRET` — **optional locally**; use Stripe CLI (see DEPLOYMENT.md) or `/checkout/stripe/confirm` after PaymentElement

---

## Local Dev Quick Start

```bash
npm install
npm run db:up                    # Docker services
cp apps/api/.env.example apps/api/.env
npm run db:migrate               # if not migrated
npm run db:seed
npm run dev:api                  # http://localhost:4000
npm run dev:storefront           # http://localhost:5173
npm run dev:admin                # http://localhost:5174
```

**Super Admin (dev):** `admin@abou-al-nas.local` / `Admin123!ChangeMe`  
**Postgres host port:** `5435` (5432 was occupied on dev machine)

---

## Current Sprint

**Phases 1–3:** ✅ Shipped in dev (Sprints 1–6 + Phase 3 invoice/docs/profile).

**Phase 4 (ops / production):** Not started — staging VPS, Certbot, CI/CD, test suite, monitoring.

### Phase 3 — Invoice, API docs, profile ✅

**Invoice**
- `GET /orders/:id/invoice` — HTML (Arabic RTL, Cairo font, print button)
- `GET /orders/:id/invoice.pdf` — PDFKit PDF (English layout)
- Admin: same under `/admin/orders/:id/invoice` (+ `.pdf`)
- Storefront order detail + admin orders panel download buttons

**API documentation**
- Swagger UI: `/api/docs` (non-production)
- OpenAPI: `apps/api/src/openapi/openapi.json`
- Postman: `docs/postman/abou-al-nas.postman_collection.json`

**Profile**
- `GET/PATCH /users/me` — name, phone, locale + addresses in GET
- Storefront `/account` profile form

### Sprint 6 — Loyalty, referral, newsletter, cookies, analytics ✅

**Loyalty**
- Earn points when order → `delivered` / `completed` (default: 1 pt per 1 JOD)
- Redeem at checkout (default: 100 pts = 1 JOD discount)
- `/account` — balance + history

**Referral**
- Unique code per user; optional `?ref=CODE` at register
- Referrer earns loyalty points on referee's first completed order (default 5 JOD worth)

**Newsletter**
- Footer subscribe; admin subscriber list
- `POST /newsletter/subscribe` | `unsubscribe`

**Cookie consent + analytics**
- Banner (essential / accept all); GA4 + Meta Pixel load only after "accept all"
- Admin **الإعدادات** — GA4 ID, Meta Pixel ID, cookie text, loyalty/referral rates

### Sprint 5 — Refunds, analytics, SEO, bulk, email ✅

**Backend**
- Refunds: 14-day window, evidence URLs, admin approve/reject → order `refunded` + stock restore
- Analytics dashboard (`/admin/analytics/dashboard`) — revenue, orders, top products, alerts
- Audit log + CSV export (`/admin/audit/export`)
- Bulk product CSV import/export
- SEO: `sitemap.xml`, `robots.txt`, product JSON-LD
- Email (nodemailer): welcome, password reset, order confirmation when SMTP configured

**Storefront**
- Refund request on delivered/completed orders
- `SEOHead` + product structured data

**Admin**
- Dashboard with live analytics
- `/refunds`, `/bulk` (import/export)

**Env:** `STOREFRONT_URL`, `SMTP_*` in `apps/api/.env`

### Sprint 4 — Packages, inventory, reviews ✅

**Backend**
- Packages CRUD (bundle price must be less than sum of items); cart + checkout support
- Inventory: adjust stock, history, low-stock alerts (`default_low_stock_threshold`)
- Reviews: verified purchase (delivered/completed), admin moderation, rating recalc
- Wishlist (auth): add/remove/toggle
- Product compare API (`GET /products/compare?ids=...`, max 4)

**Storefront**
- `/packages`, `/packages/:slug`, `/wishlist`, `/compare`
- Product page: ratings, wishlist, compare
- Cart supports product + package line items

**Admin**
- `/packages`, `/inventory`, `/reviews`

**Seed:** `cleaning-bundle` (HD-001 + HD-002 at 6.50 JOD)

### Sprint 3 — Promotions & CMS ✅

**Backend**
- Coupons (`percent`, `fixed`, `free_shipping`) + flash campaigns
- Checkout quote/place-order coupon integration (`POST /checkout/validate-coupon`)
- CMS: hero slides, static pages, FAQs, blog, contact payload
- Seed: `WELCOME10`, `FREESHIP`, flash campaign on HD-001, hero/about/FAQs/blog

**Storefront**
- Dynamic home (CMS hero + flash offers), Footer, contact/blog/static pages
- Checkout coupon field with live quote discount

**Admin**
- `/promotions` — coupons + campaigns CRUD
- `/cms` — hero slides, pages, blog posts

**Test coupons:** `WELCOME10` (10% off), `FREESHIP` (free shipping)

---

## Pending Tasks (Roadmap)

### Phase 1 — MVP Core (weeks 1–4) ✅
- [x] Auth, RBAC seed
- [x] Categories (nested), products, tags, search sync
- [x] Cart (guest + user merge)
- [x] Checkout, COD + Stripe test
- [x] Orders + auto status + timeline
- [x] Storefront profile (`/account`, `/users/me`)
- [x] Admin settings UI (`/settings`)
- [x] Email SMTP (welcome, order confirm, reset — when `SMTP_*` set)
- [x] Redis, Meilisearch, Cloudinary (product/refund uploads)
- [ ] Full i18n toggle AR/EN on storefront + admin (AR default today)
- [ ] Automated tests + CI/CD

### Phase 2 — Growth (weeks 5–8) ✅
- [x] Packages module
- [x] Promotion engine + flash campaigns
- [x] Inventory history + low stock alerts
- [x] CMS (hero, sections, pages, footer)
- [x] Reviews + wishlist + compare
- [x] Refund workflow with evidence
- [x] Analytics dashboard (Insights role)
- [x] SEO (meta, sitemap, structured data)
- [x] Blog (footer)
- [x] Bulk import/export
- [x] Audit log export

### Phase 3 — Engagement (weeks 9–10) ✅
- [x] Loyalty program
- [x] Referral program
- [x] Newsletter + campaigns
- [x] Cookie consent
- [x] GA4 + Meta Pixel integration
- [x] Invoice PDF + HTML download
- [x] Swagger UI + Postman collection
- [x] Profile API (`/users/me`)

### Phase 4 — Production & beyond (not started)
**Deploy / hardening (do first)**
- [ ] Staging VPS + env secrets + Certbot SSL
- [ ] GitHub Actions CI (lint, build, test)
- [ ] GitHub Actions CD to staging/production
- [ ] E2E / API test suite
- [ ] Error monitoring (e.g. Sentry), backups

**Later enhancements**
- Custom RBAC roles (beyond seeded 6 roles)
- SMS / WhatsApp order notifications
- Additional payment gateways (HyperPay, etc.)
- Full EN storefront/admin i18n
- BI connectors
- Mobile apps (REST already versioned)

---

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Meilisearch over PG full-text | Better Arabic relevance, facets, instant search, scales |
| Separate admin app | User requirement: subdomain + separate codebase |
| Meilisearch index sync | On product CRUD + nightly reconcile job |
| Guest cart in Redis | Fast, merges to DB cart on login |
| Stripe test first | Production keys when domain/live |
| No carrier integrations | In-house delivery; zone rates in DB only |
| Prisma | Team velocity, migrations, TypeScript |
| Framer Motion | Modern animations per spec |

---

## Known Issues / TBD

- Logo and final brand assets TBD
- Domain name not purchased yet
- Privacy policy specifics (Jordan) — use generic template + admin-editable legal pages
- Exact free shipping threshold amount — admin setting default TBD
- Low stock default threshold — admin setting (suggest default: 5)
- Loyalty earn/redeem rates — business rules TBD at implementation
- Referral reward rules — TBD at implementation

---

## Security Decisions

- Helmet, rate limiting, CORS allowlist (storefront + admin origins)
- Input validation: Zod on all write endpoints
- Parameterized queries via Prisma
- JWT short access + rotating refresh tokens
- httpOnly secure cookies for refresh (production)
- CSRF for cookie-based flows if used; SPA primarily Bearer
- Password bcrypt cost 12
- Audit log for admin mutations
- Refund evidence stored in Cloudinary private or signed URLs
- Age gate: 13+ checkbox at registration

---

## Future Roadmap

- Production Stripe + local gateways (MyFatoorah, etc.)
- SMS/WhatsApp (Unifonic / Meta)
- Custom roles UI
- Multi-currency (if expansion)
- React Native / Flutter app consuming same API
- Power BI / Metabase export

---

## Session Log

| Date | Action |
|------|--------|
| 2026-06-04 | Discovery completed; docs created |
| 2026-06-04 | Sprint 2: shipping zones, checkout, COD/Stripe orders, timeline, admin orders |
| 2026-07-18 | Production VPS `46.202.153.60`: Docker infra, Nginx, PM2 API, Certbot for `abualnus.com`/`www`; GitHub Actions CI/CD; DNS needed for `admin` + `api` |
