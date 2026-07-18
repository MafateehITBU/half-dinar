import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App';
import { CookieConsent } from './components/CookieConsent';
import { SiteAnalytics } from './components/SiteAnalytics';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <CookieConsent />
      <SiteAnalytics />
      <Toaster
        position="top-left"
        richColors
        closeButton
        dir="rtl"
        offset={16}
        gap={10}
        visibleToasts={4}
        toastOptions={{
          classNames: {
            toast: 'brand-toast',
            title: 'brand-toast-title',
            actionButton: 'brand-toast-action',
            closeButton: 'brand-toast-close',
            success: 'brand-toast-success',
            error: 'brand-toast-error',
            info: 'brand-toast-info',
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
);
