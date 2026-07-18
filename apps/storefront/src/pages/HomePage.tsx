import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { CategoryTree, PackageSummary, ProductSummary } from '@half-dinar/shared';
import { BRAND } from '@half-dinar/shared';
import { Layout } from '../components/Layout';
import { ProductCard } from '../components/ProductCard';
import { SEOHead } from '../components/SEOHead';
import { EmptyState } from '../components/ui/EmptyState';
import { SectionHeading } from '../components/ui/SectionHeading';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { CategoryCard } from '../components/home/CategoryCard';
import { HomeBottomCta } from '../components/home/HomeBottomCta';
import { HomeHero, type HeroSlide } from '../components/home/HomeHero';
import { PackagesTeaser } from '../components/home/PackagesTeaser';
import { QuickActions } from '../components/home/QuickActions';
import { TrustBar } from '../components/home/TrustBar';
import { api } from '../lib/api';

export function HomePage() {
  const [featured, setFeatured] = useState<ProductSummary[]>([]);
  const [flashProducts, setFlashProducts] = useState<ProductSummary[]>([]);
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [packages, setPackages] = useState<PackageSummary[]>([]);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    api.getCmsHome().then((res) => {
      const data = res.data as { heroSlides: HeroSlide[] };
      setSlides(data.heroSlides ?? []);
    });
    api.getFlashOffers().then((res) => {
      const data = res.data as { products: ProductSummary[] };
      setFlashProducts(data.products ?? []);
    });
    api.getCategories().then((res) => {
      setCategories((res.data as CategoryTree[]).filter((c) => c.isActive));
      setLoadingCategories(false);
    });
    api.getPackages().then((res) => setPackages((res.data as PackageSummary[]).slice(0, 3)));
    const params = new URLSearchParams({ featured: 'true', limit: '8' });
    api
      .getProducts(params)
      .then((res) => setFeatured(res.data as ProductSummary[]))
      .finally(() => setLoadingFeatured(false));
  }, []);

  const topCategories = categories.filter((c) => !c.parentId).slice(0, 4);

  let sectionNum = 0;
  const nextSection = (visible = true) => (visible ? ++sectionNum : undefined);
  const categoriesSection = nextSection();
  const packagesSection = nextSection(packages.length > 0);
  const flashSection = nextSection(flashProducts.length > 0);
  const featuredSection = nextSection();

  return (
    <Layout>
      <SEOHead
        title={`${BRAND.nameAr} — منتجات يومية بجودة عالية`}
        description="تسوق منتجات المنزل والنظافة والمطبخ مع توصيل لجميع أنحاء الأردن. باقات موفرة وعروض فلاش."
      />

      <HomeHero slides={slides} />
      <QuickActions />
      <TrustBar />

      <section className="page-shell section-gap !pt-0">
        <SectionHeading
          number={categoriesSection}
          title="تسوق حسب التصنيف"
          subtitle="اختر القسم المناسب — تصفّح بسرعة ووضوح"
          href="/categories"
          linkLabel="جميع التصنيفات"
        />
        {loadingCategories ? (
          <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="category-card-skeleton" />
            ))}
          </div>
        ) : topCategories.length > 0 ? (
          <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {topCategories.map((cat, i) => (
              <CategoryCard key={cat.id} category={cat} index={i} />
            ))}
          </div>
        ) : (
          <EmptyState icon="mdi:folder-outline" title="التصنيفات قريباً" description="تصفّح المتجر مباشرة في هذه الأثناء" action={{ label: 'المتجر', to: '/store' }} />
        )}
      </section>

      <PackagesTeaser packages={packages} sectionNumber={packagesSection} />

      {flashProducts.length > 0 && (
        <section className="section-gap relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-red-50/90 via-red-50/40 to-transparent" />
          <div className="page-shell relative">
            <SectionHeading number={flashSection} title="عروض فلاش" subtitle="لفترة محدودة — لا تفوتها" accent="flash" href="/store" />
            <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
              {flashProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="page-shell section-gap">
        <SectionHeading number={featuredSection} title="منتجات مميزة" subtitle="مختارة لك من فريق النص أونلاين" href="/store?sort=bestSeller" />
        <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
          {loadingFeatured
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
        {!loadingFeatured && featured.length === 0 && (
          <EmptyState icon="mdi:package-variant-closed" title="لا توجد منتجات مميزة" action={{ label: 'تصفّح المتجر', to: '/store' }} />
        )}
      </section>

      <section className="page-shell pb-4">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="surface-elevated flex flex-col items-center justify-between gap-6 p-8 md:flex-row md:p-10"
        >
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-green text-3xl text-brand-gold-light shadow-glow">
              <Icon icon="mdi:help-circle-outline" />
            </span>
            <div>
              <h2 className="font-display text-xl font-extrabold text-brand-ink">تحتاج مساعدة؟</h2>
              <p className="mt-1 text-sm text-brand-muted">فريقنا جاهز للإجابة عن الطلبات والتوصيل والاسترجاع.</p>
            </div>
          </div>
          <Link to="/contact" className="btn-primary shrink-0 gap-2 px-8">
            <Icon icon="mdi:message-text-outline" />
            تواصل معنا
          </Link>
        </motion.div>
      </section>

      <HomeBottomCta />
    </Layout>
  );
}
