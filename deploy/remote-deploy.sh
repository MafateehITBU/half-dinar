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
reload_pm2() {
  local attempt=1
  local max=5
  while true; do
    if pm2 describe abualnus-api >/dev/null 2>&1; then
      if pm2 reload deploy/ecosystem.config.cjs --env production; then
        break
      fi
    else
      if pm2 start deploy/ecosystem.config.cjs --env production; then
        break
      fi
    fi
    if (( attempt >= max )); then
      echo "PM2 reload failed after ${max} attempts — forcing"
      pm2 reload deploy/ecosystem.config.cjs --env production --force || \
        pm2 startOrReload deploy/ecosystem.config.cjs --env production
      break
    fi
    echo "PM2 busy (attempt ${attempt}/${max}), waiting 15s..."
    sleep 15
    attempt=$((attempt + 1))
  done
}
reload_pm2
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

echo "==> Ensure PayTabs return POST is proxied (avoid SPA 405)"
python3 - <<'PY'
from pathlib import Path
import re

snippet_prod = '''
    # PayTabs POSTs to return URL; SPA would 405. POST → API bridge; GET → SPA.
    location = /checkout/meps/return {
        error_page 418 = @paytabs_return_post;
        if ($request_method = POST) {
            return 418;
        }
        try_files /index.html =404;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    location @paytabs_return_post {
        rewrite ^ /api/v1/checkout/meps/return break;
        proxy_pass http://abualnus_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
    }
'''

snippet_staging = snippet_prod.replace(
    'proxy_pass http://abualnus_api;',
    'proxy_pass http://127.0.0.1:4001;',
)

roots = [Path('/etc/nginx/sites-enabled'), Path('/etc/nginx/conf.d')]
for root in roots:
    if not root.is_dir():
        continue
    for path in sorted(root.iterdir()):
        if not path.is_file():
            continue
        text = path.read_text(encoding='utf-8', errors='ignore')
        # Replace any previous (possibly broken) PayTabs return blocks
        import re as _re
        text = _re.sub(
            r'\n\s*# PayTabs POSTs[\s\S]*?location @paytabs_return_post\s*\{[\s\S]*?\n\s*\}\n',
            '\n',
            text,
            count=1,
        )
        text = _re.sub(
            r'\n\s*location = /checkout/meps/return\s*\{[\s\S]*?\n\s*\}\n\s*location @paytabs_return_post\s*\{[\s\S]*?\n\s*\}\n',
            '\n',
            text,
            count=1,
        )
        if not any(h in text for h in ('mawjood.online', 'abualnus.com', 'staging.mawjood')):
            continue
        name = path.name.lower()
        if any(x in name for x in ('dashboard', 'api.', 'admin')):
            continue
        if 'location /api/' not in text:
            continue
        insert = snippet_staging if ('staging' in text or '4001' in text) else snippet_prod
        m = re.search(r'location /api/\s*\{[\s\S]*?\n\s*\}', text)
        if not m:
            print(f'no api block {path}')
            continue
        path.write_text(text[: m.end()] + '\n' + insert + text[m.end() :], encoding='utf-8')
        print(f'patched paytabs return {path}')
PY

echo "==> Nginx reload"
nginx -t && systemctl reload nginx

echo "==> Health check"
sleep 2
curl -fsS "http://127.0.0.1:4000/api/v1/health" | head -c 400 || true
echo
echo "Deploy complete."
