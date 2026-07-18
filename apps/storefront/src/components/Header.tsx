import { useEffect, useState, FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { BRAND } from '@half-dinar/shared';
import { BrandLogo } from './brand/BrandLogo';
import { SearchField } from './ui/SearchField';
import { useCart } from '../context/CartContext';
import { api, clearAuth, isLoggedIn } from '../lib/api';
import { confirmAction, showSuccess } from '../lib/toast';

const NAV = [
  { to: '/', label: 'الرئيسية', icon: 'mdi:home-outline', match: (p: string) => p === '/' },
  { to: '/store', label: 'المتجر', icon: 'mdi:store-outline', match: (p: string) => p.startsWith('/store') || p.startsWith('/products') },
  { to: '/categories', label: 'التصنيفات', icon: 'mdi:view-grid-outline', match: (p: string) => p === '/categories' },
  { to: '/packages', label: 'الباقات', icon: 'mdi:gift-outline', match: (p: string) => p.startsWith('/packages') },
  { to: '/blog', label: 'المدونة', icon: 'mdi:post-outline', match: (p: string) => p.startsWith('/blog') },
  { to: '/contact', label: 'اتصل بنا', icon: 'mdi:phone-outline', match: (p: string) => p === '/contact' },
];

function HeaderNavLink({
  item,
  active,
  layoutId,
}: {
  item: (typeof NAV)[number];
  active: boolean;
  layoutId?: string;
}) {
  return (
    <Link to={item.to} className={`header-nav-link ${active ? 'header-nav-link-active' : ''}`}>
      {active && layoutId && (
        <motion.span
          layoutId={layoutId}
          className="header-nav-indicator"
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        />
      )}
      <Icon icon={item.icon} className="header-nav-icon" aria-hidden />
      <span className="relative z-10">{item.label}</span>
      {active && <span className="header-nav-dot" aria-hidden />}
    </Link>
  );
}

function MobileNavLink({ item, active }: { item: (typeof NAV)[number]; active: boolean }) {
  return (
    <Link to={item.to} className={`mobile-nav-link ${active ? 'mobile-nav-link-active' : ''}`}>
      <span className={`mobile-nav-icon ${active ? 'mobile-nav-icon-active' : ''}`}>
        <Icon icon={item.icon} className="text-xl" aria-hidden />
      </span>
      <span className="flex-1 font-bold">{item.label}</span>
      {active && <Icon icon="mdi:chevron-left" className="text-brand-gold opacity-80" aria-hidden />}
    </Link>
  );
}

export function Header() {
  const { cart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const loggedIn = isLoggedIn();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    const ok = await confirmAction('تسجيل الخروج', 'هل تريد تسجيل الخروج؟', 'خروج');
    if (!ok) return;
    try {
      await api.logout();
    } catch {
      clearAuth();
    }
    showSuccess('تم تسجيل الخروج');
    navigate('/');
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = searchQ.trim();
    navigate(q ? `/store?q=${encodeURIComponent(q)}` : '/store');
    setSearchQ('');
    setOpen(false);
  };

  return (
    <>
      <div className="promo-strip">
        <span className="inline-flex items-center justify-center gap-2">
          <Icon icon="mdi:truck-fast-outline" className="text-brand-gold" />
          توصيل لجميع محافظات الأردن — {BRAND.nameAr}
        </span>
      </div>

      <header
        className={`sticky top-0 z-50 border-b bg-white/95 backdrop-blur-md transition-shadow duration-300 ${
          scrolled ? 'shadow-soft' : ''
        }`}
        style={{ borderColor: 'var(--brand-sand)' }}
      >
        <div className="page-shell flex min-w-0 items-center gap-3 py-3 md:gap-4 md:py-3.5">
          <BrandLogo size="md" />

          <form onSubmit={onSearch} className="hidden min-w-0 flex-1 lg:flex lg:max-w-xl">
            <SearchField
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="ابحث عن منتج، تصنيف، أو باقة..."
              className="py-3"
            />
          </form>

          <nav className="header-nav hidden xl:flex" aria-label="التنقل الرئيسي">
            {NAV.map((item) => (
              <HeaderNavLink
                key={item.to}
                item={item}
                active={item.match(location.pathname)}
                layoutId="header-nav-active"
              />
            ))}
          </nav>

          <div className="ms-auto flex items-center gap-1 sm:gap-1.5">
            <Link to="/store" className="btn-icon hidden sm:inline-flex lg:hidden" title="بحث">
              <Icon icon="mdi:magnify" />
            </Link>
            {loggedIn && (
              <>
                <Link to="/wishlist" className="btn-icon hidden sm:inline-flex" title="المفضلة">
                  <Icon icon="mdi:heart-outline" />
                </Link>
                <Link to="/account" className="btn-icon hidden md:inline-flex" title="حسابي">
                  <Icon icon="mdi:account-circle-outline" />
                </Link>
              </>
            )}
            <Link to="/cart" className="btn-icon relative" title="السلة">
              <Icon icon="mdi:cart-outline" />
              {cart && cart.itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -left-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-gold px-1 text-[10px] font-bold text-brand-green-dark ring-2 ring-white"
                >
                  {cart.itemCount}
                </motion.span>
              )}
            </Link>
            {!loggedIn && (
              <Link to="/login" className="btn-primary hidden px-4 py-2.5 sm:inline-flex">
                <Icon icon="mdi:login" />
                <span className="hidden md:inline">دخول</span>
              </Link>
            )}
            <button
              type="button"
              className="btn-icon xl:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="القائمة"
            >
              <Icon icon={open ? 'mdi:close' : 'mdi:menu'} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-brand-green-dark/60 backdrop-blur-sm xl:hidden"
              onClick={() => setOpen(false)}
              aria-label="إغلاق"
            />
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[min(100%,340px)] flex-col bg-white shadow-float xl:hidden"
            >
              <div className="border-b p-5" style={{ borderColor: 'var(--brand-sand)' }}>
                <BrandLogo linked={false} />
                <p className="mt-2 text-xs text-brand-muted">تسوق بسهولة — توصيل سريع</p>
              </div>

              <form onSubmit={onSearch} className="border-b p-4" style={{ borderColor: 'var(--brand-sand)' }}>
                <SearchField
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="بحث..."
                />
              </form>

              <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
                {NAV.map((item) => (
                  <MobileNavLink key={item.to} item={item} active={item.match(location.pathname)} />
                ))}

                <div className="my-3 h-px bg-brand-sand" />

                {loggedIn ? (
                  <>
                    <Link to="/account" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-brand-ink hover:bg-brand-cream">
                      <Icon icon="mdi:account-circle-outline" /> حسابي
                    </Link>
                    <Link to="/wishlist" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-brand-ink hover:bg-brand-cream">
                      <Icon icon="mdi:heart-outline" /> المفضلة
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-red-600 hover:bg-red-50"
                    >
                      <Icon icon="mdi:logout" /> تسجيل الخروج
                    </button>
                  </>
                ) : (
                  <Link to="/login" className="btn-primary mx-1 mt-2 justify-center py-3">
                    <Icon icon="mdi:login" /> تسجيل الدخول
                  </Link>
                )}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
