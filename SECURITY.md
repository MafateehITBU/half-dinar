# Security — MawJooD (Abu Al-Nas) Platform

## Authentication
- Passwords: bcrypt (cost factor 12); policy requires upper, lower, digit, **special character**, min 8
- JWT access token: short-lived (**15 minutes** default)
- Refresh token: opaque, **hashed at rest**, rotation on use, revocation on logout / password reset
- Login lockout: Redis counters per email+IP (8 failures → 30 min lock)
- Rate limits (Redis-backed when Redis is up):
  - Login/register: 10 / 15 min
  - Forgot/reset/verify: 10 / hour
  - Refresh: 60 / 15 min
  - Checkout: 40 / 15 min
  - Global API: 2000 / 15 min (prod)
- Email verification tokens: single-use, 24h
- Password reset: single-use, 1h; **revokes all refresh sessions**

## Authorization
- RBAC on every `/admin/*` route (`authenticate` + `requirePermission`)
- **Staff-only dashboard login** (customer-only accounts rejected in admin SPA)
- **Super Admin only:** assign staff/`super_admin` roles; system settings write
- Sales/`customers:write` may manage customer accounts but **cannot escalate roles**

## Transport & headers
- HTTPS only in production/staging (Certbot); TLS **1.2 / 1.3 only**
- API Helmet: CSP (non-dev), HSTS, Referrer-Policy, X-Frame (defaults)
- Nginx snippets: `deploy/nginx/snippets/security-headers.conf` (HSTS, nosniff, frame, Permissions-Policy)
- CORS: whitelist via `CORS_ORIGINS` only

## Input & output
- Zod validation on mutating request bodies
- Prisma parameterized queries (SQL injection prevention)
- **Rich text:** sanitize on **save** (`sanitize-html` API) + DOMPurify on **render** (storefront)
- File upload: allowlist `image/jpeg|png|webp|gif`, max 5MB, max 5 files → Cloudinary

## CSRF / XSS
- SPAs use Bearer tokens → CSRF risk for API is low
- XSS: React escaping + HTML allowlist sanitization + CSP in non-dev

## Cookies
- `cart_token`: HttpOnly, Secure (prod), SameSite=Lax
- Access/refresh currently in localStorage (XSS surface); prefer memory + httpOnly refresh in a follow-up

## Payments (Visa / Stripe)
- Stripe Payment Element — **no card PAN on our servers** (PCI SAQ A posture)
- PaymentIntent created server-side; confirm + webhook paths
- Webhook: `constructEvent` signature verify; bind `intent.id` to order; amount sanity check
- Never log card data; store only `stripePaymentIntentId` + payment status
- COD remains available (out of card PCI scope)

## Refund anti-fraud
- Evidence images supported (Cloudinary)
- One open refund request per order
- Admin approval mandatory
- Audit log on approve/reject

## Audit & compliance
- Audit log for order status + refund moderation (expand to all admin writes over time)
- Cookie consent before non-essential tracking (GA4/Meta)
- Age 13+ gate at registration
- Admin-editable privacy/terms CMS pages

## Secrets
- `.env` never in git; `deploy/.env.infra` ignored
- Stripe, Cloudinary, SMTP, JWT secrets in env only; separate per environment
- Rotate seed admin passwords after first deploy

## Dependencies / CI
- `npm audit` (high+) reported in GitHub Actions CI
- Pin major versions; Dependabot recommended

## Staging notes
- Seed credentials live in server env (`SEED_SUPER_ADMIN_*`), not in docs plaintext after rotation
