import { Link, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';

const ITEMS = [
  { to: '/', label: 'الرئيسية', icon: 'mdi:home-outline', match: (p: string) => p === '/' },
  { to: '/store', label: 'المتجر', icon: 'mdi:store-outline', match: (p: string) => p.startsWith('/store') || p.startsWith('/products') },
  { to: '/cart', label: 'السلة', icon: 'mdi:cart-outline', match: (p: string) => p === '/cart' },
  { to: '/account', label: 'حسابي', icon: 'mdi:account-outline', match: (p: string) => p.startsWith('/account') || p === '/orders' || p.startsWith('/orders/') },
];

export function MobileNav({ cartCount }: { cartCount: number }) {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-md md:hidden"
      style={{ borderColor: 'var(--brand-sand)' }}
      aria-label="التنقل السريع"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {ITEMS.map((item) => {
          const active = item.match(location.pathname);
          const isCart = item.to === '/cart';
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-bold transition ${
                active ? 'text-brand-green' : 'text-brand-muted'
              }`}
            >
              <span
                className={`relative flex h-9 w-9 items-center justify-center rounded-xl text-xl transition ${
                  active ? 'bg-brand-green text-brand-gold-light shadow-glow' : ''
                }`}
              >
                <Icon icon={item.icon} />
                {isCart && cartCount > 0 && (
                  <span className="absolute -left-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-gold px-0.5 text-[9px] font-bold text-brand-green-dark">
                    {cartCount}
                  </span>
                )}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
