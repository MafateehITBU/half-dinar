import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { BRAND } from '@half-dinar/shared';
import { adminApi, isAdminLoggedIn, saveAdminTokens } from '../lib/api';
import { BRAND_LOGOS } from '../lib/brandLogos';

export function LoginPage() {
  const [email, setEmail] = useState('admin@abou-al-nas.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (isAdminLoggedIn()) return <Navigate to="/" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await adminApi.login(email, password);
      saveAdminTokens(res.tokens);
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تسجيل الدخول');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream px-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-brand-sand bg-white shadow-card md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-brand-green p-10 text-white md:flex">
          <span className="logo-wrap-light logo-wrap-elevated inline-flex">
            <img src={BRAND_LOGOS.horizontal} alt={BRAND.nameAr} className="h-12 w-auto max-w-[220px] object-contain object-right" />
          </span>
          <div>
            <h2 className="font-display text-2xl font-extrabold text-brand-gold-light">مرحباً بك</h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-brand-gold-light/90">
              سجّل دخولك لإدارة المنتجات والطلبات والمحتوى.
            </p>
          </div>
          <ul className="space-y-2 text-sm text-brand-gold-light/90">
            <li className="flex items-center gap-2">
              <Icon icon="mdi:shield-check" className="text-brand-gold" />
              وصول آمن
            </li>
            <li className="flex items-center gap-2">
              <Icon icon="mdi:chart-line" className="text-brand-gold" />
              إحصائيات مباشرة
            </li>
          </ul>
        </div>

        <form onSubmit={onSubmit} className="p-8 sm:p-10">
          <div className="mb-8 md:hidden">
            <span className="logo-wrap-light inline-flex">
              <img src={BRAND_LOGOS.horizontal} alt={BRAND.nameAr} className="h-10 w-auto max-w-[200px] object-contain" />
            </span>
          </div>
          <h1 className="font-display text-2xl font-extrabold text-brand-ink">دخول لوحة التحكم</h1>
          <p className="mt-1 text-sm text-brand-muted">أدخل بيانات حساب المسؤول</p>

          <label className="mt-6 block">
            <span className="mb-1.5 block text-sm font-bold text-brand-ink">البريد الإلكتروني</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="admin@example.com"
            />
          </label>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-bold text-brand-ink">كلمة المرور</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
          </label>
          {error && (
            <p className="mt-3 flex items-center gap-2 text-sm text-red-600">
              <Icon icon="mdi:alert-circle-outline" />
              {error}
            </p>
          )}
          <button type="submit" className="btn-primary mt-6 w-full py-3">
            <Icon icon="mdi:login" />
            دخول
          </button>
        </form>
      </div>
    </div>
  );
}
