import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

const ITEMS = [
  { icon: 'mdi:truck-fast-outline', title: 'توصيل سريع', desc: 'لجميع المحافظات' },
  { icon: 'mdi:shield-check-outline', title: 'دفع آمن', desc: 'بطاقات ومحافظ' },
  { icon: 'mdi:package-variant-closed-check', title: 'جودة مضمونة', desc: 'منتجات أصلية' },
  { icon: 'mdi:headset', title: 'دعم محلي', desc: 'فريق أردني' },
];

export function TrustBar() {
  return (
    <section className="page-shell pb-6">
      <div className="surface-elevated grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
        {ITEMS.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-3 rounded-2xl p-2 lg:p-3"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-green text-xl text-brand-gold-light shadow-glow">
              <Icon icon={item.icon} />
            </span>
            <div>
              <p className="text-sm font-bold text-brand-ink">{item.title}</p>
              <p className="text-xs text-brand-muted">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
