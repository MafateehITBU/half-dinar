import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { FormEvent, useEffect, useState } from 'react';
import { BRAND } from '@half-dinar/shared';
import { ProductImage } from '../ProductImage';
import { SearchField } from '../ui/SearchField';

export interface HeroSlide {
  id: string;
  imageUrl: string;
  titleAr?: string;
  titleEn?: string;
  ctaText?: string;
  ctaLink?: string;
}

interface HomeHeroProps {
  slides: HeroSlide[];
}

const STATS = [
  { icon: 'mdi:truck-fast-outline', label: 'توصيل', value: '48 ساعة' },
  { icon: 'mdi:shield-check-outline', label: 'جودة', value: 'مضمونة' },
  { icon: 'mdi:headset', label: 'دعم', value: 'محلي' },
];

export function HomeHero({ slides }: HomeHeroProps) {
  const navigate = useNavigate();
  const [slideIndex, setSlideIndex] = useState(0);
  const [searchQ, setSearchQ] = useState('');

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setSlideIndex((i) => (i + 1) % slides.length), 7000);
    return () => clearInterval(t);
  }, [slides.length]);

  const slide = slides[slideIndex];
  const prev = () => setSlideIndex((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setSlideIndex((i) => (i + 1) % slides.length);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = searchQ.trim();
    navigate(q ? `/store?q=${encodeURIComponent(q)}` : '/store');
  };

  return (
    <section className="page-shell section-gap !pb-8 md:!pb-12">
      <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
        {/* Main bento hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel-dark relative min-h-[420px] overflow-hidden lg:col-span-8 lg:min-h-[480px]"
        >
          <AnimatePresence mode="wait">
            {slide && (
              <motion.div
                key={slide.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 }}
                className="absolute inset-0"
              >
                <ProductImage
                  src={slide.imageUrl}
                  alt={slide.titleAr ?? BRAND.nameAr}
                  aspectClass="absolute inset-0 h-full w-full"
                  className="h-full w-full rounded-none opacity-40"
                  imgClassName="h-full w-full object-cover"
                  showSkeleton={false}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="hero-scrim absolute inset-0 rounded-[var(--radius-panel)]" />

          <div className="relative z-10 flex h-full min-h-[420px] flex-col justify-between p-6 md:p-8 lg:min-h-[480px]">
            <div className="flex flex-wrap gap-2">
              <span className="hero-badge">
                <Icon icon="mdi:sparkles" />
                {BRAND.nameAr}
              </span>
              <span className="hero-badge">
                <Icon icon="mdi:tag-outline" />
                عروض أسبوعية
              </span>
            </div>

            <div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide?.id ?? 'fallback'}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4 }}
                >
                  <h1 className="hero-text-shadow max-w-xl font-display text-3xl font-extrabold leading-tight text-white md:text-4xl lg:text-5xl text-balance">
                    {slide?.titleAr ?? 'كل ما يحتاجه منزلك — بجودة وثقة'}
                  </h1>
                  <p className="hero-subtitle mt-3 max-w-md text-sm font-medium md:text-base">
                    منتجات يومية مختارة. أسعار واضحة، تسوق سهل، وتوصيل لبابك.
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link to={slide?.ctaLink ?? '/store'} className="btn-accent px-6 py-3">
                  <Icon icon="mdi:shopping-outline" />
                  {slide?.ctaText ?? 'تسوق الآن'}
                </Link>
                <Link to="/packages" className="btn-secondary border-white/30 bg-white/10 !text-white hover:!bg-white/20">
                  <Icon icon="mdi:gift-outline" />
                  الباقات
                </Link>
              </div>

              {slides.length > 1 && (
                <div className="mt-6 flex items-center gap-2">
                  <button type="button" onClick={prev} className="btn-icon !border-white/30 !bg-white/10 !text-white" aria-label="السابق">
                    <Icon icon="mdi:chevron-right" />
                  </button>
                  <div className="flex gap-1.5">
                    {slides.map((s, i) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSlideIndex(i)}
                        className={`h-1.5 rounded-full transition-all ${i === slideIndex ? 'w-6 bg-brand-gold' : 'w-1.5 bg-white/40'}`}
                        aria-label={`شريحة ${i + 1}`}
                      />
                    ))}
                  </div>
                  <button type="button" onClick={next} className="btn-icon !border-white/30 !bg-white/10 !text-white" aria-label="التالي">
                    <Icon icon="mdi:chevron-left" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Side bento stack */}
        <div className="flex flex-col gap-4 lg:col-span-4">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="surface-elevated flex flex-1 flex-col p-6"
          >
            <p className="flex items-center gap-2 text-sm font-bold text-brand-green">
              <Icon icon="mdi:magnify" className="text-xl" />
              ابحث في المتجر
            </p>
            <form onSubmit={onSearch} className="mt-4 flex flex-col gap-2 sm:flex-row">
              <SearchField
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="منظف، مطبخ، ورق..."
                wrapperClassName="flex-1"
              />
              <button type="submit" className="btn-primary shrink-0">بحث</button>
            </form>
            <p className="mt-3 text-xs text-brand-muted">أكثر من 1000 منتج — تصفّح حسب التصنيف</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="panel-gold p-6"
          >
            <p className="font-display text-lg font-extrabold">باقات موفرة</p>
            <p className="mt-1 text-sm opacity-90">وفّر أكثر عند الشراء بالجملة</p>
            <Link to="/packages" className="btn-primary mt-4 w-full bg-brand-green-dark">
              <Icon icon="mdi:gift-outline" />
              اكتشف الباقات
            </Link>
          </motion.div>

          <div className="grid grid-cols-3 gap-3">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.05 }}
                className="stat-tile items-center text-center !p-3"
              >
                <Icon icon={s.icon} className="text-xl text-brand-green" />
                <p className="text-[10px] font-medium text-brand-muted">{s.label}</p>
                <p className="text-xs font-bold text-brand-ink">{s.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
