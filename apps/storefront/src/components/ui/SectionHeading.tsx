import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

export function SectionHeading({
  title,
  subtitle,
  href,
  linkLabel = 'عرض الكل',
  accent,
  number,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  accent?: 'flash' | 'default';
  /** 1-based section number shown beside the title (e.g. 1 → "01") */
  number?: number;
}) {
  const num = number !== undefined ? String(number).padStart(2, '0') : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mb-10 flex flex-wrap items-end justify-between gap-4"
    >
      <div className="flex items-start gap-4">
        {num && (
          <span
            className={`hidden font-display text-4xl font-extrabold leading-none sm:block ${
              accent === 'flash' ? 'text-red-200' : 'text-brand-sand'
            }`}
          >
            {num}
          </span>
        )}
        <div>
          {accent === 'flash' && (
            <span className="badge-gold mb-2 !bg-red-50 !text-red-700 !ring-red-200">
              <Icon icon="mdi:flash" />
              لفترة محدودة
            </span>
          )}
          <h2
            className={`font-display text-2xl font-extrabold md:text-3xl lg:text-[2rem] ${
              accent === 'flash' ? 'text-red-800' : 'text-brand-ink'
            }`}
          >
            {title}
          </h2>
          {subtitle && <p className="mt-2 max-w-lg text-sm leading-relaxed text-brand-muted md:text-base">{subtitle}</p>}
          <span className="brand-divider mt-4 inline-block" />
        </div>
      </div>
      {href && (
        <Link to={href} className="btn-secondary gap-2 px-5 py-2.5 text-sm">
          {linkLabel}
          <Icon icon="mdi:arrow-left" />
        </Link>
      )}
    </motion.div>
  );
}
