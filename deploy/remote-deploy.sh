#!/usr/bin/env bash
# Runs on the VPS after code is synced to /var/www/abualnus
set -euo pipefail

APP_DIR=/var/www/abualnus
cd "$APP_DIR"

echo "==> Installing dependencies"
npm ci

echo "==> Prisma generate (required before API tsc)"
cd apps/api
npx prisma generate
cd "$APP_DIR"

echo "==> Building shared + api + storefront + admin"
npm run build -w @half-dinar/shared
npm run build -w @half-dinar/api

# Vite picks up VITE_* from apps/storefront/.env and apps/admin/.env if present
npm run build -w @half-dinar/storefront
npm run build -w @half-dinar/admin

echo "==> Prisma migrate"
cd apps/api
npx prisma migrate deploy
cd "$APP_DIR"

echo "==> Reload API (PM2)"
if pm2 describe abualnus-api >/dev/null 2>&1; then
  pm2 reload deploy/ecosystem.config.cjs --env production
else
  pm2 start deploy/ecosystem.config.cjs --env production
fi
pm2 save

echo "==> Nginx reload"
nginx -t && systemctl reload nginx

echo "==> Health check"
sleep 2
curl -fsS "http://127.0.0.1:4000/api/v1/health" | head -c 400 || true
echo
echo "Deploy complete."
