import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { BRAND } from '@half-dinar/shared';
import { BrandLogo } from './brand/BrandLogo';
import { NewsletterForm } from './NewsletterForm';

const FOOTER_LINKS = [
  {
    title: 'تسوق',
    links: [
      { to: '/store', label: 'جميع المنتجات', icon: 'mdi:store-outline' },
      { to: '/packages', label: 'الباقات الموفرة', icon: 'mdi:gift-outline' },
      { to: '/store?sort=bestSeller', label: 'الأكثر مبيعاً', icon: 'mdi:fire' },
      { to: '/compare', label: 'مقارنة المنتجات', icon: 'mdi:compare' },
    ],
  },
  {
    title: 'الشركة',
    links: [
      { to: '/pages/about', label: 'من نحن', icon: 'mdi:information-outline' },
      { to: '/contact', label: 'اتصل بنا', icon: 'mdi:phone-outline' },
      { to: '/blog', label: 'المدونة', icon: 'mdi:post-outline' },
    ],
  },
  {
    title: 'الحساب',
    links: [
      { to: '/login', label: 'تسجيل الدخول', icon: 'mdi:login' },
      { to: '/orders', label: 'طلباتي', icon: 'mdi:clipboard-list-outline' },
      { to: '/wishlist', label: 'المفضلة', icon: 'mdi:heart-outline' },
    ],
  },
];

const TRUST = [
  { icon: 'mdi:truck-fast-outline', label: 'توصيل وطني' },
  { icon: 'mdi:shield-check-outline', label: 'دفع آمن' },
  { icon: 'mdi:headset', label: 'دعم محلي' },
];

export function Footer() {
  return (
    <footer className="relative mt-auto overflow-hidden">
      <div className="panel-dark mx-4 mb-4 mt-16 rounded-[var(--radius-panel)] md:mx-6 lg:mx-8">
        <div className="page-shell !px-0 py-12 md:py-16">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
            <motion.div
              className="lg:col-span-4"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <BrandLogo linked onDark size="lg" />
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-gold-light/90">
                {BRAND.nameAr} — تجربة تسوق عصرية لمنتجات المنزل والمطبخ مع توصيل لبابك في كل الأردن.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {TRUST.map((t) => (
                  <span key={t.label} className="hero-badge">
                    <Icon icon={t.icon} />
                    {t.label}
                  </span>
                ))}
              </div>
            </motion.div>

            {FOOTER_LINKS.map((group, gi) => (
              <motion.div
                key={group.title}
                className="lg:col-span-2"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: gi * 0.05 }}
              >
                <p className="mb-4 text-sm font-bold text-brand-gold">{group.title}</p>
                <nav className="flex flex-col gap-2.5">
                  {group.links.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="group flex items-center gap-2.5 text-sm text-brand-gold-light/90 transition hover:text-white"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-brand-gold transition group-hover:bg-brand-gold/20">
                        <Icon icon={link.icon} className="text-base" />
                      </span>
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </motion.div>
            ))}

            <motion.div
              className="lg:col-span-4"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
            >
              <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-sm font-bold text-brand-gold">ابقَ على اطلاع</p>
                <p className="mt-1 text-xs text-brand-gold-light/80">عروض حصرية ومنتجات جديدة كل أسبوع</p>
                <NewsletterForm />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="border-t py-6 text-center text-xs text-brand-muted" style={{ borderColor: 'var(--brand-sand)' }}>
        © {new Date().getFullYear()} {BRAND.nameAr} — جميع الحقوق محفوظة
      </div>
    </footer>
  );
}
