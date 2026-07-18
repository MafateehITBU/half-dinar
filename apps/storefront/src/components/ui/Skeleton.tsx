export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer rounded-xl bg-gradient-to-r from-brand-sand/80 via-brand-cream to-brand-sand/80 bg-[length:200%_100%] ${className}`}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="product-card">
      <div className="product-card-shadow opacity-30" aria-hidden />
      <div className="product-card-inner">
        <div className="m-3 mb-0 aspect-[4/5] overflow-hidden rounded-[1.1rem] bg-brand-sand/50 p-1">
          <Skeleton className="h-full w-full rounded-[0.9rem]" />
        </div>
        <div className="space-y-3 px-4 pb-4 pt-6">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-10 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
