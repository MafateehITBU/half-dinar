import { Navigate, Route, Routes } from 'react-router-dom';
import { isAdminLoggedIn } from './lib/api';
import { SwalRouteCleanup } from './components/SwalRouteCleanup';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { ProductsPage } from './pages/ProductsPage';
import { OrdersPage } from './pages/OrdersPage';
import { PromotionsPage } from './pages/PromotionsPage';
import { CmsPage } from './pages/CmsPage';
import { PackagesPage } from './pages/PackagesPage';
import { InventoryPage } from './pages/InventoryPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { RefundsPage } from './pages/RefundsPage';
import { BulkPage } from './pages/BulkPage';
import { SettingsPage } from './pages/SettingsPage';
import { ShippingPage } from './pages/ShippingPage';
import { NewsletterPage } from './pages/NewsletterPage';
import { ContactMessagesPage } from './pages/ContactMessagesPage';
import { UsersPage } from './pages/UsersPage';

function Protected({ children }: { children: React.ReactNode }) {
  if (!isAdminLoggedIn()) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <SwalRouteCleanup />
      <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Protected><DashboardPage /></Protected>} />
      <Route path="/categories" element={<Protected><CategoriesPage /></Protected>} />
      <Route path="/products" element={<Protected><ProductsPage /></Protected>} />
      <Route path="/orders" element={<Protected><OrdersPage /></Protected>} />
      <Route path="/users" element={<Protected><UsersPage /></Protected>} />
      <Route path="/promotions" element={<Protected><PromotionsPage /></Protected>} />
      <Route path="/cms" element={<Protected><CmsPage /></Protected>} />
      <Route path="/packages" element={<Protected><PackagesPage /></Protected>} />
      <Route path="/inventory" element={<Protected><InventoryPage /></Protected>} />
      <Route path="/reviews" element={<Protected><ReviewsPage /></Protected>} />
      <Route path="/refunds" element={<Protected><RefundsPage /></Protected>} />
      <Route path="/bulk" element={<Protected><BulkPage /></Protected>} />
      <Route path="/shipping" element={<Protected><ShippingPage /></Protected>} />
      <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />
      <Route path="/newsletter" element={<Protected><NewsletterPage /></Protected>} />
      <Route path="/contact-messages" element={<Protected><ContactMessagesPage /></Protected>} />
      </Routes>
    </>
  );
}
