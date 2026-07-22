#!/usr/bin/env bash
# Deploy staging app at /var/www/mawjood-staging
set -euo pipefail

APP_DIR=/var/www/mawjood-staging
cd "$APP_DIR"

echo "==> Installing dependencies"
npm ci

echo "==> Prisma generate"
cd apps/api
npx prisma generate
cd "$APP_DIR"

echo "==> Building"
npm run build -w @half-dinar/shared
npm run build -w @half-dinar/api
npm run build -w @half-dinar/storefront
npm run build -w @half-dinar/admin

echo "==> Migrate"
cd apps/api
npx prisma migrate deploy
cd "$APP_DIR"

echo "==> Reload staging API"
if pm2 describe mawjood-api-staging >/dev/null 2>&1; then
  pm2 reload deploy/ecosystem.staging.config.cjs
else
  pm2 start deploy/ecosystem.staging.config.cjs
fi
pm2 save

echo "==> Nginx reload"
nginx -t && systemctl reload nginx

sleep 2
curl -fsS "http://127.0.0.1:4001/api/v1/health" | head -c 400 || true
echo
echo "Staging deploy complete."
