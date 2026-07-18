import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { ReactNode } from 'react';

interface Breadcrumb {
  label: string;
  to?: string;
}

interface PageHeroProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  action?: ReactNode;
  compact?: boolean;
  stats?: { label: string; value: string }[];
}

export function PageHero({ title, subtitle, breadcrumbs, action, compact, stats }: PageHeroProps) {
  const crumbs = (breadcrumbs ?? []).filter(
    (b, i, arr) => !(i === arr.length - 1 && b.label === title),
  );

  return (
    <motion.header
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`page-banner ${compact ? '' : ''}`}
    >
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          {crumbs.length > 0 && (
            <nav aria-label="مسار التنقل" className="mb-4 flex flex-wrap items-center gap-1.5 text-sm">
              {crumbs.map((b, i) => (
                <span key={`${b.label}-${i}`} className="flex items-center gap-1.5">
                  {i > 0 && <Icon icon="mdi:chevron-left" className="text-brand-gold/60" aria-hidden />}
                  {b.to ? (
                    <Link to={b.to} className="font-semibold text-brand-gold transition hover:text-white">
                      {b.label}
                    </Link>
                  ) : (
                    <span className="font-semibold text-white/90">{b.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <span className="hero-badge">
              <Icon icon="mdi:leaf" />
              النص أونلاين
            </span>
          </div>

          <h1
            className={`hero-text-shadow mt-3 font-display font-extrabold tracking-tight text-white text-balance ${
              compact ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl lg:text-[2.75rem]'
            }`}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="hero-subtitle mt-3 max-w-xl text-sm font-medium leading-relaxed md:text-base">{subtitle}</p>
          )}
          <span className="brand-divider mt-5 inline-block" />
        </div>

        {action && <div className="relative z-10 shrink-0">{action}</div>}
      </div>

      {stats && stats.length > 0 && (
        <div className="relative z-10 mt-8 grid gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm"
            >
              <p className="text-xs font-medium text-brand-gold-light/80">{s.label}</p>
              <p className="mt-0.5 text-lg font-extrabold text-white">{s.value}</p>
            </div>
          ))}
        </div>
      )}
    </motion.header>
  );
}
