import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

const ITEMS = [
  { to: '/store', icon: 'mdi:store-outline', title: 'المتجر', desc: 'كل المنتجات', color: 'bg-brand-green text-brand-gold-light' },
  { to: '/categories', icon: 'mdi:view-grid-outline', title: 'التصنيفات', desc: 'كل الأقسام', color: 'bg-brand-cream text-brand-green ring-1 ring-brand-sand' },
  { to: '/packages', icon: 'mdi:gift-outline', title: 'الباقات', desc: 'وفّر أكثر', color: 'bg-brand-gold text-brand-green-dark' },
  { to: '/store?sort=bestSeller', icon: 'mdi:fire', title: 'الأكثر مبيعاً', desc: 'اختيار العملاء', color: 'bg-brand-cream text-brand-green ring-1 ring-brand-sand' },
  { to: '/contact', icon: 'mdi:headset', title: 'المساعدة', desc: 'تواصل معنا', color: 'bg-white text-brand-green ring-1 ring-brand-sand' },
  { to: '/blog', icon: 'mdi:post-outline', title: 'المدونة', desc: 'نصائح وعروض', color: 'bg-white text-brand-green ring-1 ring-brand-sand' },
];

export function QuickActions() {
  return (
    <section className="page-shell -mt-4 pb-4">
      <div className="flex gap-3 overflow-x-auto overscroll-x-contain pb-2 scrollbar-none">
        {ITEMS.map((item, i) => (
          <motion.div
            key={item.to}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link to={item.to} className="quick-link-card group min-w-[148px]">
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xl transition group-hover:scale-105 ${item.color}`}>
                <Icon icon={item.icon} />
              </span>
              <div>
                <p className="font-bold text-brand-ink">{item.title}</p>
                <p className="text-xs text-brand-muted">{item.desc}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
