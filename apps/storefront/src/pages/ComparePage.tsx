import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import type { ProductSummary } from '@half-dinar/shared';
import { Layout } from '../components/Layout';
import { ProductImage } from '../components/ProductImage';
import { Container } from '../components/ui/Container';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHero } from '../components/ui/PageHero';
import { api } from '../lib/api';
import { getCompareIds, removeFromCompare } from '../lib/compare';

export function ComparePage() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    const ids = getCompareIds();
    if (!ids.length) {
      setProducts([]);
      setLoading(false);
      return;
    }
    api.compareProducts(ids).then((res) => setProducts(res.data as ProductSummary[])).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('compare-updated', handler);
    return () => window.removeEventListener('compare-updated', handler);
  }, []);

  const rows: { label: string; render: (p: ProductSummary) => ReactNode }[] = [
    {
      label: 'السعر',
      render: (p) => <span className="text-lg font-extrabold text-brand-green">{p.price.toFixed(2)} د.أ</span>,
    },
    {
      label: 'التقييم',
      render: (p) => (
        <span className="flex items-center justify-center gap-1 font-bold">
          <Icon icon="mdi:star" className="text-brand-gold" />
          {p.avgRating.toFixed(1)} <span className="text-xs font-normal text-brand-muted">({p.reviewCount})</span>
        </span>
      ),
    },
    {
      label: 'التوفر',
      render: (p) => (
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${p.inStock ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>
          {p.inStock ? 'متوفر' : 'غير متوفر'}
        </span>
      ),
    },
    {
      label: 'التصنيف',
      render: (p) => <span className="text-sm text-brand-muted">{p.category.nameAr}</span>,
    },
  ];

  return (
    <Layout>
      <Container className="space-y-8">
        <PageHero compact title="مقارنة المنتجات" subtitle="قارن حتى 4 منتجات جنباً إلى جنب" breadcrumbs={[{ label: 'الرئيسية', to: '/' }]} />

        {loading ? (
          <div className="h-64 animate-pulse rounded-[var(--radius-panel)] bg-brand-sand/60" />
        ) : !products.length ? (
          <EmptyState icon="mdi:compare" title="لا توجد منتجات للمقارنة" description="اضغط «قارن» في صفحة أي منتج (حتى 4 منتجات)" action={{ label: 'المتجر', to: '/store' }} />
        ) : (
          <div className="overflow-x-auto">
            <div className="inline-flex min-w-full gap-4">
              {products.map((p) => (
                <div key={p.id} className="surface-elevated w-64 shrink-0 overflow-hidden">
                  <div className="relative">
                    <ProductImage src={p.imageUrl} alt={p.nameAr} aspectClass="aspect-square w-full" className="rounded-none" />
                    <button
                      type="button"
                      onClick={() => { removeFromCompare(p.id); load(); }}
                      className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-600 shadow-sm"
                      aria-label="إزالة"
                    >
                      <Icon icon="mdi:close" />
                    </button>
                  </div>
                  <div className="p-4">
                    <Link to={`/products/${p.slug}`} className="line-clamp-2 font-bold text-brand-ink hover:text-brand-green">
                      {p.nameAr}
                    </Link>
                    <div className="mt-4 space-y-3 border-t pt-4" style={{ borderColor: 'var(--brand-sand)' }}>
                      {rows.map((row) => (
                        <div key={row.label}>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-brand-muted">{row.label}</p>
                          <div className="mt-1">{row.render(p)}</div>
                        </div>
                      ))}
                    </div>
                    <Link to={`/products/${p.slug}`} className="btn-primary mt-4 w-full py-2.5 text-xs">
                      عرض المنتج
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Container>
    </Layout>
  );
}
