#!/usr/bin/env node
/**
 * Sync storefront/assets logos → public/brand (storefront + admin).
 * Source of truth: apps/storefront/assets/LOGO done-*.png
 */
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assets = join(root, 'apps/storefront/assets');

const targets = [
  join(root, 'apps/storefront/public/brand'),
  join(root, 'apps/admin/public/brand'),
];

const mapping = [
  ['LOGO done-02.png', 'logo-horizontal.png'],
  ['LOGO done-01.png', 'logo-stacked.png'],
  ['LOGO done-03.png', 'logo-alt.png'],
];

for (const dir of targets) {
  mkdirSync(dir, { recursive: true });
  for (const [src, dest] of mapping) {
    copyFileSync(join(assets, src), join(dir, dest));
    console.log(`→ ${dest} (${dir.split('/apps/')[1]})`);
  }
}

console.log('Brand logos synced.');
