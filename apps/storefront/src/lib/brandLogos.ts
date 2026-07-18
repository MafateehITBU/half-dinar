/** Canonical logos — edit files in apps/storefront/assets/, then run: npm run sync:brand */
import logoHorizontal from '../../assets/LOGO done-02.png';
import logoStacked from '../../assets/LOGO done-01.png';
import logoAlt from '../../assets/LOGO done-03.png';

export const BRAND_LOGOS = {
  horizontal: logoHorizontal,
  stacked: logoStacked,
  alt: logoAlt,
} as const;
