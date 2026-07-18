import { Link } from 'react-router-dom';
import { BRAND } from '@half-dinar/shared';
import { BRAND_LOGOS } from '../../lib/brandLogos';

interface BrandLogoProps {
  linked?: boolean;
  variant?: 'horizontal' | 'stacked';
  size?: 'sm' | 'md' | 'lg';
  /** Extra elevation when sitting on dark green panels (footer, login, etc.) */
  onDark?: boolean;
}

const SIZES = {
  sm: 'h-9',
  md: 'h-11',
  lg: 'h-14',
};

export function BrandLogo({
  linked = true,
  variant = 'horizontal',
  size = 'md',
  onDark = false,
}: BrandLogoProps) {
  const src =
    variant === 'stacked' ? BRAND_LOGOS.stacked : BRAND_LOGOS.horizontal;
  const height = SIZES[size];

  const content = (
    <span className={`logo-wrap-light ${onDark ? 'logo-wrap-elevated' : ''}`}>
      <img
        src={src}
        alt={BRAND.nameAr}
        className={`${height} w-auto max-w-[min(100%,220px)] object-contain object-right`}
        loading="eager"
      />
    </span>
  );

  if (!linked) return content;
  return (
    <Link to="/" className="inline-flex shrink-0 transition hover:opacity-95">
      {content}
    </Link>
  );
}
