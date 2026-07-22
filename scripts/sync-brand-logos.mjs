#!/usr/bin/env node
/**
 * Sync storefront/assets logos → public/brand (storefront + admin).
 * Source of truth: apps/storefront/assets/LOGO.png
 */
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'apps/storefront/assets/LOGO.png');

const targets = [
  join(root, 'apps/storefront/public/brand'),
  join(root, 'apps/admin/public/brand'),
];

const destNames = ['logo-horizontal.png', 'logo-stacked.png', 'logo-alt.png'];

for (const dir of targets) {
  mkdirSync(dir, { recursive: true });
  for (const dest of destNames) {
    copyFileSync(src, join(dir, dest));
    console.log(`→ ${dest} (${dir.split('/apps/')[1]})`);
  }
}

console.log('Brand logos synced.');
