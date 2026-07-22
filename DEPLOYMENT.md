# Deployment — Abu Al-Nas

## Environments

| Environment | Purpose | URL |
|-------------|---------|-----|
| development | Local machine + Docker Compose | localhost |
| staging | Pre-production on VPS | https://staging.mawjood.online |
| production | Live VPS | https://mawjood.online |

### Staging URLs

| App | URL |
|-----|-----|
| Store | https://staging.mawjood.online |
| Dashboard | https://dashboard.staging.mawjood.online |
| API | https://api.staging.mawjood.online |

**Staging admin (seed):** `admin@staging.mawjood.online` / `StagingAdmin123!ChangeMe`

### Staging workflow

1. Develop on a feature branch locally  
2. Merge into Git branch **`staging`**  
3. GitHub Action **Deploy staging** syncs → builds → migrates → reloads PM2 `mawjood-api-staging`  
4. Test on staging URLs  
5. Merge **`staging` → `main`** to deploy production  

App root on server: `/var/www/mawjood-staging`  
Infra: `docker compose -f docker-compose.staging.yml --env-file deploy/.env.staging.infra up -d`  
Deploy script: `deploy/remote-deploy-staging.sh`

## Local development (current phase)

```bash
# Prerequisites: Node 20+, Docker
docker compose up -d   # postgres, redis, meilisearch
cd apps/api && cp .env.example .env && npm run migrate && npm run dev
cd apps/storefront && npm run dev
cd apps/admin && npm run dev
```

## DNS (required)

VPS IP: **`46.202.153.60`**

| Type | Host | Value | Purpose |
|------|------|-------|---------|
| A | `@` | `46.202.153.60` | Storefront — `https://mawjood.online` |
| A | `www` | `46.202.153.60` | Storefront www |
| A | `dashboard` | `46.202.153.60` | **Dashboard** — `https://dashboard.mawjood.online` |
| A | `api` | `46.202.153.60` | API / Stripe webhooks — `https://api.mawjood.online` |

After DNS propagates, issue SSL:

```bash
ssh root@46.202.153.60
certbot --nginx -d mawjood.online -d www.mawjood.online -d dashboard.mawjood.online -d api.mawjood.online --redirect
```

## VPS production

App root: `/var/www/abualnus`

| Service | How |
|---------|-----|
| Postgres / Redis / Meilisearch | `docker compose -f docker-compose.prod.yml --env-file deploy/.env.infra up -d` |
| API | PM2 (`abualnus-api`) |
| Storefront / Admin | Nginx static (`apps/*/dist`) + `/api` reverse proxy |
| SSL | Certbot + Nginx |

Bootstrap (once): `deploy/server-setup.sh`  
Deploy on server: `deploy/remote-deploy.sh`

## Environment variables (API)

On the VPS only (never commit): `apps/api/.env`, `apps/storefront/.env`, `deploy/.env.infra`

Key groups:
- `DATABASE_URL`, `REDIS_URL`, `MEILI_HOST`, `MEILI_MASTER_KEY`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `CLOUDINARY_*`, `STRIPE_*`, `SMTP_*`
- `CORS_ORIGINS`, `API_URL`, `STOREFRONT_URL`

## CI/CD — GitHub Actions

- **CI** (`.github/workflows/ci.yml`): on PR/push to `main` — install + build
- **Deploy production** (`.github/workflows/deploy.yml`): on push to `main`
- **Deploy staging** (`.github/workflows/deploy-staging.yml`): on push to `staging`

### GitHub secrets (Settings → Secrets → Actions)

| Secret | Value |
|--------|--------|
| `DEPLOY_HOST` | `46.202.153.60` |
| `DEPLOY_USER` | `root` |
| `DEPLOY_SSH_KEY` | private key used for deploy (ed25519) |

## Backups

- Daily `pg_dump` cron
- Meilisearch dump optional (rebuild from PG if needed)
- Cloudinary retention per provider policy

## SSL

- Certbot auto-renew
- Force HTTPS redirects at Nginx
- **TLS 1.0 & 1.1 disabled** (KYC / PCI) — only `TLSv1.2` and `TLSv1.3`
- HSTS enabled on storefront + admin

Verify:
```bash
openssl s_client -connect mawjood.online:443 -tls1_1   # must fail
openssl s_client -connect mawjood.online:443 -tls1_2   # must succeed
```

## Payment-gateway KYC — website checklist

| Requirement | Status | URL |
|-------------|--------|-----|
| Terms & Conditions | ✅ | https://mawjood.online/pages/terms-and-conditions |
| Privacy Policy | ✅ | https://mawjood.online/pages/privacy-policy |
| Shipping / Delivery Policy | ✅ | https://mawjood.online/pages/shipping-policy |
| Pricing / Services Policy | ✅ | https://mawjood.online/pages/pricing-policy |
| Cancellation / Refund Policy | ✅ | https://mawjood.online/pages/cancellation-policy |
| About / company page | ✅ | https://mawjood.online/pages/about |
| Contact page | ✅ | https://mawjood.online/contact |
| HTTPS + modern TLS only | ✅ | TLS 1.2 / 1.3 |
| Policies editable (AR + EN) | ✅ | https://dashboard.mawjood.online/cms → السياسات القانونية |

Editable later from the admin CMS without redeploying.

## Stripe (test mode)

### API keys (Dashboard → Developers → API keys)

| Variable | File |
|----------|------|
| `STRIPE_SECRET_KEY` | `apps/api/.env` (`sk_test_...`) |
| `STRIPE_PUBLISHABLE_KEY` | `apps/api/.env` (same `pk_test_...`) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `apps/storefront/.env` (same `pk_test_...`) |
| `STRIPE_CHARGE_CURRENCY` | `apps/api/.env` — default `usd` (most test accounts do not support `jod`) |
| `STRIPE_JOD_TO_USD` | `apps/api/.env` — rate when charging in USD (~`1.41`) |

Visa/Mastercard in checkout use **Stripe** — there are no separate Visa API credentials. Use [Stripe test cards](https://docs.stripe.com/testing#cards) with `sk_test_` / `pk_test_` keys only:

| Brand | Test number | Expiry / CVC |
|-------|-------------|----------------|
| Visa (success) | `4242 4242 4242 4242` | Any future date, any 3-digit CVC |
| Visa (debit) | `4000 0566 5566 5556` | Same |
| Mastercard | `5555 5555 5555 4444` | Same |
| Declined | `4000 0000 0000 0002` | Same |

Order confirmation email for card payments is sent **after** payment succeeds (`/checkout/stripe/confirm` or webhook), not at `place-order`.

### Webhook secret (`whsec_...`) — separate from API keys

**Local dev (Stripe CLI — recommended):**
```bash
stripe listen --forward-to localhost:4000/api/v1/webhooks/stripe
```
Copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`.

**Production:** Dashboard → Developers → Webhooks → Add endpoint → copy signing secret.

**Without webhook locally:** Leave `STRIPE_WEBHOOK_SECRET` empty — COD works fully; Stripe uses `/checkout/stripe/confirm` after PaymentElement payment.

