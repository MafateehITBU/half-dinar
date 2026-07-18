import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { ProductImage } from './ProductImage';

interface ProductGalleryProps {
  images: string[];
  alt: string;
  discountPct?: number | null;
}

export function ProductGallery({ images, alt, discountPct }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const go = useCallback(
    (delta: number) => {
      if (images.length <= 1) return;
      setActive((i) => (i + delta + images.length) % images.length);
    },
    [images.length],
  );

  useEffect(() => setActive(0), [images]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowLeft') go(1);
      if (e.key === 'ArrowRight') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, go]);

  return (
    <>
      <div className="pd-gallery">
        <div className="pd-gallery-accent" aria-hidden />

        <div className="pd-gallery-inner">
          {images.length > 1 && (
            <div className="pd-thumbs-col hidden lg:flex" role="tablist" aria-label="صور المنتج">
              {images.map((url, i) => (
                <button
                  key={url + i}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  onClick={() => setActive(i)}
                  className={`pd-thumb ${i === active ? 'pd-thumb-on' : ''}`}
                >
                  <ProductImage src={url} alt="" aspectClass="h-full w-full" showSkeleton={false} imgClassName="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="pd-stage">
            <button
              type="button"
              className="pd-stage-btn"
              onClick={() => images.length > 0 && setLightbox(true)}
              aria-label="تكبير"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={images[active] ?? 'empty'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full w-full"
                >
                  <ProductImage
                    src={images[active]}
                    alt={alt}
                    aspectClass="aspect-[4/5] lg:aspect-[5/6]"
                    imgClassName="h-full w-full object-cover"
                  />
                </motion.div>
              </AnimatePresence>
            </button>

            {discountPct && discountPct > 0 && (
              <span className="pd-gallery-badge">-{discountPct}%</span>
            )}

            {images.length > 1 && (
              <>
                <span className="pd-gallery-count">{active + 1}/{images.length}</span>
                <button type="button" className="pd-nav pd-nav-r" onClick={() => go(-1)} aria-label="السابق">
                  <Icon icon="mdi:chevron-right" />
                </button>
                <button type="button" className="pd-nav pd-nav-l" onClick={() => go(1)} aria-label="التالي">
                  <Icon icon="mdi:chevron-left" />
                </button>
              </>
            )}
          </div>
        </div>

        {images.length > 1 && (
          <div className="pd-thumbs-row lg:hidden" role="tablist">
            {images.map((url, i) => (
              <button
                key={url + i}
                type="button"
                onClick={() => setActive(i)}
                className={`pd-thumb ${i === active ? 'pd-thumb-on' : ''}`}
              >
                <ProductImage src={url} alt="" aspectClass="h-full w-full" showSkeleton={false} imgClassName="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightbox && images.length > 0 && (
          <motion.div className="pd-lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLightbox(false)}>
            <button type="button" className="pd-lightbox-x" onClick={() => setLightbox(false)} aria-label="إغلاق">
              <Icon icon="mdi:close" />
            </button>
            <motion.img
              key={images[active]}
              src={images[active]}
              alt={alt}
              className="pd-lightbox-img"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
