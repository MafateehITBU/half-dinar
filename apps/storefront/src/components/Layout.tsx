import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileNav } from './MobileNav';
import { PageTransition } from './PageTransition';
import { useCart } from '../context/CartContext';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { cart } = useCart();

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-brand-pattern">
      <Header />
      <main className="relative z-0 min-w-0 flex-1 overflow-x-hidden pb-0 md:pb-0">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>{children}</PageTransition>
        </AnimatePresence>
      </main>
      <Footer />
      <MobileNav cartCount={cart?.itemCount ?? 0} />
      <div className="mobile-nav-spacer" aria-hidden />
    </div>
  );
}
