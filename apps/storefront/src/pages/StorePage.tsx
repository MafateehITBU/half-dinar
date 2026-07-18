import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { CategoryTree, ProductSummary } from '@half-dinar/shared';
import { Layout } from '../components/Layout';
import { ProductCard } from '../components/ProductCard';
import { Container } from '../components/ui/Container';
import { EmptyState } from '../components/ui/EmptyState';
import { SearchField } from '../components/ui/SearchField';
import { PageHero } from '../components/ui/PageHero';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { api } from '../lib/api';

export function StorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categorySlug = searchParams.get('category') ?? '';
  const sort = searchParams.get('sort') ?? 'newest';
  const page = Number(searchParams.get('page') ?? 1);

  useEffect(() => {
    api.getCategories().then((res) => setCategories(res.data as CategoryTree[]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '12', sort });
    if (categorySlug) params.set('categorySlug', categorySlug);
    if (query) params.set('q', query);

    api
      .getProducts(params)
      .then((res) => {
        setProducts(res.data as ProductSummary[]);
        setPagination(res.pagination as typeof pagination);
      })
      .finally(() => setLoading(false));
  }, [categorySlug, sort, page, query]);

  const flatCategories = (nodes: CategoryTree[], depth = 0): { slug: string; nameAr: string; depth: number; icon?: string | null }[] =>
    nodes.flatMap((n) => [
      { slug: n.slug, nameAr: n.nameAr, depth, icon: n.icon },
      ...flatCategories(n.children, depth + 1),
    ]);

  const applySearch = () => {
    const p = new URLSearchParams(searchParams);
    if (query) p.set('q', query);
    else p.delete('q');
    p.set('page', '1');
    setSearchParams(p);
  };

  const setCategory = (slug: string | null) => {
    const p = new URLSearchParams(searchParams);
    if (slug) p.set('category', slug);
    else p.delete('category');
    p.set('page', '1');
    setSearchParams(p);
    setFiltersOpen(false);
  };

  const categoryFilter = (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setCategory(null)}
        className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-right text-sm font-medium transition ${
          !categorySlug ? 'bg-brand-green text-brand-gold-light shadow-glow' : 'hover:bg-brand-cream'
        }`}
      >
        <Icon icon="mdi:view-grid-outline" />
        جميع التصنيفات
      </button>
      {flatCategories(categories).map((c) => (
        <button
          key={c.slug}
          type="button"
          onClick={() => setCategory(c.slug)}
          className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-right text-sm transition ${
            categorySlug === c.slug ? 'bg-brand-green font-semibold text-brand-gold-light shadow-glow' : 'hover:bg-brand-cream'
          }`}
          style={{ paddingRight: `${12 + c.depth * 10}px` }}
        >
          {c.icon && <Icon icon={c.icon} className="shrink-0 text-lg opacity-90" />}
          {c.nameAr}
        </button>
      ))}
    </div>
  );

  return (
    <Layout>
      <Container className="space-y-8">
        <PageHero
          title="المتجر"
          subtitle="تصفّح، صنّف، ورتّب — تجربة تسوق واضحة وسريعة"
          breadcrumbs={[{ label: 'الرئيسية', to: '/' }]}
          stats={[
            { label: 'المنتجات', value: loading ? '...' : String(pagination.total) },
            { label: 'الترتيب', value: sort === 'newest' ? 'الأحدث' : sort === 'bestSeller' ? 'الأكثر مبيعاً' : 'مخصص' },
            { label: 'الصفحة', value: `${page} / ${pagination.totalPages}` },
          ]}
        />

        <div className="surface-elevated flex flex-col gap-3 p-4 md:flex-row md:items-center md:p-5">
          <SearchField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            placeholder="ابحث عن منتج..."
            wrapperClassName="flex-1"
          />
          <div className="flex gap-2">
            <button type="button" onClick={applySearch} className="btn-primary shrink-0 px-6 lg:hidden">
              بحث
            </button>
            <button type="button" onClick={() => setFiltersOpen(true)} className="btn-secondary shrink-0 lg:hidden">
              <Icon icon="mdi:filter-variant" />
              تصفية
            </button>
            <select
              value={sort}
              onChange={(e) => {
                const p = new URLSearchParams(searchParams);
                p.set('sort', e.target.value);
                p.set('page', '1');
                setSearchParams(p);
              }}
              className="select-field lg:w-48"
            >
              <option value="newest">الأحدث</option>
              <option value="bestSeller">الأكثر مبيعاً</option>
              <option value="priceAsc">السعر: من الأقل</option>
              <option value="priceDesc">السعر: من الأعلى</option>
              <option value="rating">التقييم</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 lg:hidden">
          <button type="button" onClick={() => setCategory(null)} className={`chip ${!categorySlug ? 'chip-active' : ''}`}>
            الكل
          </button>
          {flatCategories(categories).slice(0, 12).map((c) => (
            <button key={c.slug} type="button" onClick={() => setCategory(c.slug)} className={`chip ${categorySlug === c.slug ? 'chip-active' : ''}`}>
              {c.nameAr}
            </button>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="surface-elevated hidden h-fit p-5 lg:sticky lg:top-28 lg:block">
            <p className="mb-4 flex items-center gap-2 text-sm font-bold text-brand-ink">
              <Icon icon="mdi:filter-variant" className="text-lg text-brand-green" />
              التصنيفات
            </p>
            {categoryFilter}
          </aside>

          <div>
            {loading ? (
              <div className="grid gap-5 grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <EmptyState
                icon="mdi:package-variant-closed"
                title="لا توجد منتجات مطابقة"
                description="جرّب تصنيفاً آخر أو عدّل البحث"
                action={{ label: 'عرض الكل', to: '/store' }}
              />
            ) : (
              <>
                <div className="grid gap-5 grid-cols-2 xl:grid-cols-3">
                  {products.map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} />
                  ))}
                </div>
                {pagination.totalPages > 1 && (
                  <div className="mt-12 flex flex-wrap justify-center gap-2">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                      <motion.button
                        key={p}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const params = new URLSearchParams(searchParams);
                          params.set('page', String(p));
                          setSearchParams(params);
                        }}
                        className={`min-w-11 rounded-2xl px-4 py-2.5 text-sm font-bold transition ${
                          p === page ? 'bg-brand-green text-brand-gold-light shadow-glow' : 'surface-card text-brand-muted hover:border-brand-green'
                        }`}
                      >
                        {p}
                      </motion.button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Container>

      {filtersOpen && (
        <>
          <button type="button" className="fixed inset-0 z-40 bg-brand-green-dark/60 backdrop-blur-sm lg:hidden" onClick={() => setFiltersOpen(false)} aria-label="إغلاق" />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-[var(--radius-panel)] bg-white p-5 shadow-float lg:hidden">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-bold text-brand-ink">التصنيفات</p>
              <button type="button" onClick={() => setFiltersOpen(false)} className="btn-icon">
                <Icon icon="mdi:close" />
              </button>
            </div>
            {categoryFilter}
          </div>
        </>
      )}
    </Layout>
  );
}
