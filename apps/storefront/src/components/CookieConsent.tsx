import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { getConsent, setConsent } from '../lib/consent';
import { api } from '../lib/api';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState('نستخدم ملفات تعريف الارتباط لتحسين تجربتك وتحليل الزيارات.');

  useEffect(() => {
    if (!getConsent()) setVisible(true);
    api.getPublicConfig().then((r) => {
      const cfg = r.data as { cookieBanner?: { ar?: string } };
      if (cfg.cookieBanner?.ar) setText(cfg.cookieBanner.ar);
    }).catch(() => {});
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-[4.5rem] left-4 right-4 z-50 md:bottom-6 md:left-auto md:right-6 md:max-w-md">
      <div className="surface-elevated flex flex-col gap-4 p-5 shadow-float md:p-6">
        <p className="flex items-start gap-3 text-sm font-medium text-brand-ink">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green text-xl text-brand-gold-light">
            <Icon icon="mdi:cookie-outline" />
          </span>
          {text}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setConsent('essential'); setVisible(false); }}
            className="btn-secondary flex-1 py-2.5 text-xs"
          >
            الضرورية فقط
          </button>
          <button type="button" onClick={() => { setConsent('all'); setVisible(false); }} className="btn-primary flex-1 py-2.5 text-xs">
            قبول الكل
          </button>
        </div>
      </div>
    </div>
  );
}
