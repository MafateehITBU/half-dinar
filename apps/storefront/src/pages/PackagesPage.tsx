import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { PackageSummary } from '@half-dinar/shared';
import { Layout } from '../components/Layout';
import { ProductImage } from '../components/ProductImage';
import { Container } from '../components/ui/Container';
import { PageHero } from '../components/ui/PageHero';
import { api } from '../lib/api';

export function PackagesPage() {
  const [packages, setPackages] = useState<PackageSummary[]>([]);

  useEffect(() => {
    api.getPackages().then((res) => setPackages(res.data as PackageSummary[]));
  }, []);

  return (
    <Layout>
      <Container className="space-y-10">
        <PageHero
          title="الباقات والعروض"
          subtitle="وفّر أكثر عند شراء المنتجات مجمّعة في باقة واحدة"
          breadcrumbs={[{ label: 'الرئيسية', to: '/' }]}
        />

        {!packages.length ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="surface-card py-20 text-center text-brand-muted"
          >
            <Icon icon="mdi:gift-off-outline" className="mx-auto text-5xl text-brand-sand" />
            <p className="mt-4">لا توجد باقات حالياً</p>
          </motion.div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg, i) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -8 }}
              >
                <Link to={`/packages/${pkg.slug}`} className="group surface-card-interactive block overflow-hidden rounded-3xl">
                  <div className="relative">
                    <ProductImage src={pkg.imageUrl} alt={pkg.nameAr} aspectClass="aspect-[4/3]" />
                    {pkg.savings > 0 && (
                      <span className="badge-gold absolute right-3 top-3">
                        وفّر {pkg.savings.toFixed(2)} د.أ
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h2 className="text-lg font-bold text-brand-ink group-hover:text-primary-700">{pkg.nameAr}</h2>
                    <p className="mt-1 flex items-center gap-1 text-sm text-brand-muted">
                      <Icon icon="mdi:package-variant" />
                      {pkg.itemsCount} منتجات
                    </p>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-primary-700">{pkg.price.toFixed(2)}</span>
                      <span className="text-sm text-brand-muted">د.أ</span>
                      <span className="text-sm text-brand-muted line-through">{pkg.retailTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </Container>
    </Layout>
  );
}
