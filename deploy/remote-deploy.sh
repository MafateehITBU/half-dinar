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

echo "==> Ensure SPA HTML is not cached (index.html / client routes)"
python3 - <<'PY'
from pathlib import Path
import re

needle = 'no-store, no-cache, must-revalidate'
markers = ('mawjood.online', 'abualnus.com', 'staging.mawjood')
root = Path('/etc/nginx/sites-enabled')
if not root.is_dir():
    root = Path('/etc/nginx/conf.d')

for path in sorted(root.glob('*')):
    if not path.is_file():
        continue
    text = path.read_text(encoding='utf-8', errors='ignore')
    if needle in text:
        continue
    if not any(m in text for m in markers):
        continue
    updated, n = re.subn(
        r'(location\s+/\s*\{)',
        r'\1\n        add_header Cache-Control "no-store, no-cache, must-revalidate";',
        text,
        count=1,
    )
    if n:
        path.write_text(updated, encoding='utf-8')
        print(f'patched {path}')
PY

echo "==> Nginx reload"
nginx -t && systemctl reload nginx

echo "==> Health check"
sleep 2
curl -fsS "http://127.0.0.1:4000/api/v1/health" | head -c 400 || true
echo
echo "Deploy complete."
