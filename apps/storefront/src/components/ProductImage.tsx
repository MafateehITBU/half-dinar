import { useState } from 'react';
import { motion } from 'framer-motion';
import { normalizeImageUrl, PLACEHOLDER_IMAGE } from '../lib/images';

type ProductImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  aspectClass?: string;
  showSkeleton?: boolean;
};

export function ProductImage({
  src,
  alt,
  className = '',
  imgClassName = 'h-full w-full object-cover',
  aspectClass = 'aspect-square',
  showSkeleton = true,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const normalized = normalizeImageUrl(src);
  const displaySrc = !normalized || failed ? PLACEHOLDER_IMAGE : normalized;

  return (
    <div className={`relative overflow-hidden bg-brand-cream ${aspectClass} ${className}`}>
      {showSkeleton && !loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-brand-sand via-brand-cream to-brand-sand" />
      )}
      <motion.img
        src={displaySrc}
        alt={alt}
        className={`${imgClassName} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setFailed(true);
          setLoaded(true);
        }}
        initial={{ scale: 1.02 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4 }}
      />
    </div>
  );
}
