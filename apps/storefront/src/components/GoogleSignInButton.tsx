import { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { api, type PublicConfig } from '../lib/api';
import { showError } from '../lib/toast';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            ux_mode?: string;
            context?: string;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, string | number | boolean>,
          ) => void;
          prompt?: () => void;
        };
      };
    };
  }
}

let gisScriptPromise: Promise<void> | null = null;

function loadGisScript() {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gisScriptPromise) return gisScriptPromise;
  gisScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-gis]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Google script failed')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleGis = '1';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google script failed'));
    document.head.appendChild(script);
  });
  return gisScriptPromise;
}

type Props = {
  onCredential: (idToken: string) => Promise<void> | void;
  label?: string;
};

export function GoogleSignInButton({ onCredential, label = 'المتابعة مع Google' }: Props) {
  const btnRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [clientId, setClientId] = useState(
    () => import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || '',
  );
  const [enabled, setEnabled] = useState(Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()));
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;

  useEffect(() => {
    let cancelled = false;
    api
      .getPublicConfig()
      .then((r) => {
        if (cancelled) return;
        const cfg = r.data as PublicConfig;
        if (cfg.googleAuth?.enabled && cfg.googleAuth.clientId) {
          setClientId(cfg.googleAuth.clientId);
          setEnabled(true);
        } else if (!import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()) {
          setEnabled(false);
        }
      })
      .catch(() => {
        /* keep Vite fallback */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !clientId || !btnRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        await loadGisScript();
        if (cancelled || !btnRef.current || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            void Promise.resolve(callbackRef.current(response.credential)).catch((err) => {
              showError(err instanceof Error ? err.message : 'فشل تسجيل الدخول عبر Google');
            });
          },
          ux_mode: 'popup',
          context: 'signin',
        });
        btnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(btnRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: Math.min(btnRef.current.offsetWidth || 320, 400),
          locale: 'ar',
        });
        setReady(true);
      } catch {
        if (!cancelled) setEnabled(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, clientId]);

  if (!enabled) return null;

  return (
    <div className="space-y-2">
      <div
        ref={btnRef}
        className="flex min-h-12 w-full items-center justify-center overflow-hidden rounded-xl"
        aria-label={label}
      />
      {!ready && (
        <p className="flex items-center justify-center gap-2 text-xs text-brand-muted">
          <Icon icon="mdi:loading" className="animate-spin" />
          تحميل Google…
        </p>
      )}
    </div>
  );
}
