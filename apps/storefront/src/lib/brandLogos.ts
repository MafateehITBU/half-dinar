/** Canonical logo — edit apps/storefront/assets/LOGO.png, then run: npm run sync:brand */
import logo from '../../assets/LOGO.png';

export const BRAND_LOGOS = {
  horizontal: logo,
  stacked: logo,
  alt: logo,
} as const;
