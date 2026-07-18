import { FormEvent, useState } from 'react';
import { api } from '../lib/api';

export function NewsletterForm({ variant = 'footer' }: { variant?: 'footer' | 'light' }) {
  const isLight = variant === 'light';
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.subscribeNewsletter({ email, newsletter: true, offers: true });
      setMsg('تم الاشتراك بنجاح');
      setEmail('');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'فشل الاشتراك');
    }
  };

  return (
    <form onSubmit={onSubmit} className={isLight ? '' : 'mt-4'}>
      {!isLight && <p className="text-sm font-semibold text-brand-gold">النشرة البريدية</p>}
      <div className={`flex gap-2 ${isLight ? '' : 'mt-2'}`}>
        <input
          type="email"
          required
          placeholder="بريدك الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={
            isLight
              ? 'input-field flex-1'
              : 'flex-1 rounded-xl border border-brand-gold/30 bg-brand-green-dark px-3 py-2.5 text-sm text-white placeholder:text-brand-gold-light/60 focus:outline-none focus:ring-2 focus:ring-brand-gold/40'
          }
        />
        <button type="submit" className={isLight ? 'btn-primary shrink-0 px-5' : 'btn-accent shrink-0 px-4 py-2.5 text-sm'}>
          اشترك
        </button>
      </div>
      {msg && <p className={`mt-2 text-xs ${isLight ? 'text-brand-green' : 'text-brand-gold-light'}`}>{msg}</p>}
    </form>
  );
}
