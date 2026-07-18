import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { PackageSummary } from '@half-dinar/shared';
import { SectionHeading } from '../ui/SectionHeading';
import { ProductImage } from '../ProductImage';

export function PackagesTeaser({ packages, sectionNumber }: { packages: PackageSummary[]; sectionNumber?: number }) {
  if (packages.length === 0) return null;

  return (
    <section className="section-gap bg-white">
      <div className="page-shell">
        <SectionHeading
          number={sectionNumber}
          title="باقات موفرة"
          subtitle="جمعنا لك المنتجات الأكثر طلباً في باقة واحدة بسعر أقل"
          href="/packages"
        />
        <div className="grid gap-5 md:grid-cols-3">
          {packages.map((pkg, i) => (
            <motion.article
              key={pkg.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bento-cell group overflow-hidden"
            >
              <Link to={`/packages/${pkg.slug}`} className="block">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <ProductImage
                    src={pkg.imageUrl}
                    alt={pkg.nameAr}
                    className="rounded-none"
                    imgClassName="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 badge-green">
                    <Icon icon="mdi:gift-outline" />
                    باقة
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-brand-ink group-hover:text-brand-green">{pkg.nameAr}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-brand-muted">{pkg.itemsCount} منتج — وفّر {pkg.savings.toFixed(2)} د.أ</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-2xl font-extrabold text-brand-green">{pkg.price.toFixed(2)} <span className="text-xs font-medium text-brand-muted">د.أ</span></span>
                    <span className="flex items-center gap-1 text-xs font-bold text-brand-green">
                      عرض
                      <Icon icon="mdi:arrow-left" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
