# Security — Abu Al-Nas Platform

## Authentication
- Passwords: bcrypt (cost factor 12)
- JWT access token: short-lived (15 minutes)
- Refresh token: hashed at rest, rotation on use, revocation on logout
- Email verification before sensitive actions (configurable strictness)
- Password reset: single-use tokens, 1-hour expiry

## Authorization
- RBAC on every `/admin/*` route
- Principle of least privilege per default role
- Super Admin only: role assignment, system settings

## Transport & headers
- HTTPS only in production (Certbot)
- Helmet: CSP, HSTS, X-Frame-Options, etc.
- CORS: whitelist `www.{domain}`, `admin.{domain}` only

## Input & output
- Zod validation on all request bodies
- Prisma parameterized queries (SQL injection prevention)
- HTML sanitization for CMS/rich text (DOMPurify on render + server sanitize on save)
- File upload: allowlist image types, max size, virus scan optional later

## Rate limiting
- Redis-backed: auth endpoints stricter (e.g. 5/min), general API 100/min per IP
- Checkout: additional per-user limits

## CSRF / XSS
- SPAs use Bearer tokens → CSRF lower risk for API
- If refresh in httpOnly cookie: SameSite=strict + CSRF token for mutating cookie routes
- XSS: React escaping + CSP `script-src 'self'`

## Cookies
- `cartToken`: HttpOnly, Secure (prod), SameSite=Lax
- No sensitive data in localStorage except non-secret UI prefs

## Payments
- Stripe: webhook signature verification; never log card data
- COD: no PCI scope; confirm order server-side only

## Refund anti-fraud
- Evidence images required
- One open refund request per order
- Admin approval mandatory
- Audit log on approve/reject

## Audit & compliance
- Audit all admin writes (who, what, when)
- Export for accountability
- Cookie consent before non-essential tracking (GA4/Meta after consent)
- Age 13+ gate at registration
- Privacy policy: admin-editable; Jordan-focused template (legal review recommended)

## Secrets
- `.env` never in git; use `.env.example` templates
- Stripe keys, Cloudinary, SMTP, JWT secret in env only
- Separate secrets per environment

## Dependencies
- `npm audit` in CI (when enabled)
- Pin major versions; Dependabot recommended
