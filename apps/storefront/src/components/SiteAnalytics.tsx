import { useEffect } from 'react';
import { getConsent } from '../lib/consent';
import { api } from '../lib/api';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

function loadGa4(id: string) {
  if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${id}"]`)) return;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(script);
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', id);
}

function loadMetaPixel(pid: string) {
  if (window.fbq) {
    window.fbq('init', pid);
    window.fbq('track', 'PageView');
    return;
  }
  const f = window;
  const n: {
    (...args: unknown[]): void;
    callMethod?: (...args: unknown[]) => void;
    queue: unknown[];
    loaded?: boolean;
    version?: string;
  } = function (...args: unknown[]) {
    if (n.callMethod) n.callMethod(...args);
    else n.queue.push(args);
  };
  n.queue = [];
  f.fbq = n;
  if (!f._fbq) f._fbq = n;
  n.loaded = true;
  n.version = '2.0';
  window.fbq!('init', pid);
  window.fbq!('track', 'PageView');
}

export function SiteAnalytics() {
  useEffect(() => {
    const load = () => {
      if (getConsent() !== 'all') return;
      api.getPublicConfig().then((res) => {
        const cfg = res.data as { ga4MeasurementId?: string; metaPixelId?: string };
        if (cfg.ga4MeasurementId) loadGa4(cfg.ga4MeasurementId);
        if (cfg.metaPixelId) loadMetaPixel(cfg.metaPixelId);
      }).catch(() => {});
    };
    load();
    window.addEventListener('consent-updated', load);
    return () => window.removeEventListener('consent-updated', load);
  }, []);

  return null;
}
