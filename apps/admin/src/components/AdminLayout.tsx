import { Link, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { BRAND } from '@half-dinar/shared';
import { adminLogout } from '../lib/api';
import { BRAND_LOGOS } from '../lib/brandLogos';

const NAV = [
  {
    title: 'الرئيسية',
    items: [{ to: '/', label: 'نظرة عامة', icon: 'mdi:view-dashboard-outline' }],
  },
  {
    title: 'المبيعات',
    items: [
      { to: '/orders', label: 'الطلبات', icon: 'mdi:clipboard-list-outline' },
      { to: '/users', label: 'المستخدمون', icon: 'mdi:account-group-outline' },
      { to: '/refunds', label: 'الاسترداد', icon: 'mdi:cash-refund' },
    ],
  },
  {
    title: 'الكتالوج',
    items: [
      { to: '/categories', label: 'التصنيفات', icon: 'mdi:folder-outline' },
      { to: '/products', label: 'المنتجات', icon: 'mdi:package-variant-closed' },
      { to: '/packages', label: 'الباقات', icon: 'mdi:gift-outline' },
      { to: '/inventory', label: 'المخزون', icon: 'mdi:warehouse' },
      { to: '/reviews', label: 'التقييمات', icon: 'mdi:star-outline' },
    ],
  },
  {
    title: 'التسويق',
    items: [
      { to: '/promotions', label: 'العروض', icon: 'mdi:tag-outline' },
      { to: '/newsletter', label: 'النشرة', icon: 'mdi:email-outline' },
      { to: '/contact-messages', label: 'رسائل التواصل', icon: 'mdi:message-text-outline' },
      { to: '/cms', label: 'المحتوى', icon: 'mdi:text-box-outline' },
    ],
  },
  {
    title: 'النظام',
    items: [
      { to: '/bulk', label: 'استيراد/تصدير', icon: 'mdi:file-delimited-outline' },
      { to: '/settings', label: 'الإعدادات', icon: 'mdi:cog-outline' },
    ],
  },
];

function NavLink({ to, label, icon }: { to: string; label: string; icon: string }) {
  const location = useLocation();
  const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
        active
          ? 'bg-brand-gold/20 font-bold text-brand-gold-light shadow-sm ring-1 ring-brand-gold/30'
          : 'text-brand-gold-light/75 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon icon={icon} className="shrink-0 text-lg" />
      <span>{label}</span>
    </Link>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const currentSection = NAV.flatMap((g) => g.items).find(
    (i) => location.pathname === i.to || (i.to !== '/' && location.pathname.startsWith(i.to)),
  );

  return (
    <div className="min-h-screen bg-brand-cream">
      <aside className="fixed inset-y-0 right-0 z-40 flex w-64 flex-col border-l border-brand-green-dark bg-brand-green text-white shadow-glow">
        <div className="border-b border-brand-gold/20 px-5 py-5">
          <span className="logo-wrap-light logo-wrap-elevated inline-flex">
            <img src={BRAND_LOGOS.horizontal} alt={BRAND.nameAr} className="h-10 w-auto max-w-[200px] object-contain object-right" />
          </span>
          <p className="mt-2 text-xs font-medium text-brand-gold-light/80">لوحة الإدارة</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV.map((group) => (
            <div key={group.title} className="mb-5">
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-brand-gold/60">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink key={item.to} {...item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-brand-gold/20 p-4">
          <button
            type="button"
            onClick={() => {
              adminLogout();
              window.location.href = '/login';
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
          >
            <Icon icon="mdi:logout" className="text-lg" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <div className="mr-64 min-h-screen">
        <header className="sticky top-0 z-30 border-b border-brand-sand bg-white/95 px-8 py-4 backdrop-blur">
          <p className="text-xs font-medium text-brand-muted">لوحة التحكم</p>
          <h1 className="font-display text-lg font-bold text-brand-ink">{currentSection?.label ?? 'الإدارة'}</h1>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
