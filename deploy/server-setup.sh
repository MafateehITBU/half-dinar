#!/usr/bin/env bash
# One-time VPS bootstrap for Abu Al-Nas (run as root).
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

echo "==> System packages"
apt-get update -y
apt-get install -y \
  ca-certificates curl gnupg ufw fail2ban \
  nginx certbot python3-certbot-nginx \
  rsync git build-essential

echo "==> Node.js 20"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
node -v
npm -v

echo "==> PM2"
npm install -g pm2

echo "==> Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi
# compose plugin usually bundled with docker CE
docker --version
docker compose version

echo "==> App directories"
mkdir -p /var/www/abualnus /var/www/certbot
mkdir -p /var/www/abualnus/apps/storefront/dist /var/www/abualnus/apps/admin/dist

echo "==> Firewall"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable || true

echo "==> Bootstrap done"
