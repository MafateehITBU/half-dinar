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
reload_pm2_staging() {
  local attempt=1
  local max=5
  while true; do
    if pm2 describe mawjood-api-staging >/dev/null 2>&1; then
      if pm2 reload deploy/ecosystem.staging.config.cjs; then
        break
      fi
    else
      if pm2 start deploy/ecosystem.staging.config.cjs; then
        break
      fi
    fi
    if (( attempt >= max )); then
      echo "PM2 reload failed after ${max} attempts — forcing"
      pm2 reload deploy/ecosystem.staging.config.cjs --force || \
        pm2 startOrReload deploy/ecosystem.staging.config.cjs
      break
    fi
    echo "PM2 busy (attempt ${attempt}/${max}), waiting 15s..."
    sleep 15
    attempt=$((attempt + 1))
  done
}
reload_pm2_staging
pm2 save

echo "==> Ensure SPA HTML is not cached"
python3 - <<'PY'
from pathlib import Path
import re

needle = 'no-store, no-cache, must-revalidate'
markers = ('staging.mawjood.online', 'dashboard.staging.mawjood.online')
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

sleep 2
curl -fsS "http://127.0.0.1:4001/api/v1/health" | head -c 400 || true
echo
echo "Staging deploy complete."
