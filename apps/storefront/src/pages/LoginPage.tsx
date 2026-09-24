import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { loginSchema, registerSchema } from '@half-dinar/shared';
import { Layout } from '../components/Layout';
import { BrandLogo } from '../components/brand/BrandLogo';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { Container } from '../components/ui/Container';
import { api, saveAuthTokens } from '../lib/api';
import { useCart } from '../context/CartContext';
import { formatZodErrors } from '../lib/errors';
import { showError, showSuccess } from '../lib/toast';

function splitFullName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') ?? '');
  const { refresh } = useCart();

  const finishAuth = async (
    tokens: { accessToken: string; refreshToken: string },
    successMsg: string,
  ) => {
    saveAuthTokens(tokens.accessToken, tokens.refreshToken);
    try {
      await api.mergeCart();
      await refresh();
    } catch {
      /* empty */
    }
    showSuccess(successMsg);
    const redirect = searchParams.get('redirect');
    if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
      navigate(redirect);
    } else if (redirect === 'checkout') {
      navigate('/checkout');
    } else if (redirect === 'account') {
      navigate('/account');
    } else {
      navigate('/');
    }
  };

  const onGoogle = async (idToken: string) => {
    setError('');
    try {
      const res = await api.loginWithGoogle(idToken, referralCode.trim() || undefined);
      await finishAuth(res.tokens, 'تم تسجيل الدخول عبر Google');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل تسجيل الدخول عبر Google';
      setError(msg);
      showError(msg);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') {
        const parsed = loginSchema.safeParse({ email, password });
        if (!parsed.success) {
          showError(formatZodErrors(parsed.error));
          return;
        }
        const res = await api.login(parsed.data.email, parsed.data.password);
        await finishAuth(res.tokens, 'مرحباً بعودتك!');
      } else {
        const { firstName, lastName } = splitFullName(fullName);
        if (!firstName) {
          showError('أدخل اسمك');
          return;
        }
        const parsed = registerSchema.safeParse({
          email,
          password,
          firstName,
          lastName,
          locale: 'ar',
          ageConfirmed: true,
          referralCode: referralCode.trim() || undefined,
        });
        if (!parsed.success) {
          showError(formatZodErrors(parsed.error));
          return;
        }
        const res = await api.register(parsed.data);
        await finishAuth(
          (res as { tokens: { accessToken: string; refreshToken: string } }).tokens,
          'تم إنشاء الحساب! تحقق من بريدك لتفعيل الحساب.',
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل تسجيل الدخول';
      setError(msg);
      showError(msg);
    }
  };

  return (
    <Layout>
      <Container narrow className="py-8 md:py-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-elevated overflow-hidden md:grid md:grid-cols-2"
        >
          <div className="panel-dark relative hidden flex-col justify-between p-10 md:flex">
            <div className="relative z-10">
              <BrandLogo linked={false} onDark size="lg" />
            </div>
            <div className="relative z-10 mt-8 rounded-2xl border border-white/10 bg-brand-green-dark/85 p-6 backdrop-blur-sm">
              <h2 className="hero-text-shadow font-display text-2xl font-extrabold">مرحباً بك</h2>
              <p className="hero-subtitle mt-3 text-sm font-semibold leading-relaxed">
                سجّل بسرعة عبر Google أو بالبريد — واحفظ عناوينك للطلب السريع لاحقاً.
              </p>
            </div>
            <ul className="relative z-10 space-y-3 rounded-2xl border border-white/10 bg-brand-green-dark/75 p-5 text-sm font-medium text-brand-gold-light">
              <li className="flex items-center gap-2">
                <Icon icon="mdi:google" className="text-brand-gold" />
                دخول بضغطة واحدة عبر Google
              </li>
              <li className="flex items-center gap-2">
                <Icon icon="mdi:map-marker" className="text-brand-gold" />
                عناوين محفوظة للتوصيل
              </li>
              <li className="flex items-center gap-2">
                <Icon icon="mdi:check-circle" className="text-brand-gold" />
                تتبع الطلبات والمفضلة
              </li>
            </ul>
          </div>

          <div className="p-5 sm:p-8">
            <div className="mb-5 md:hidden">
              <BrandLogo linked={false} />
            </div>
            <div className="mb-5 tab-bar">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`tab-item ${mode === 'login' ? 'tab-item-active' : ''}`}
              >
                دخول
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`tab-item ${mode === 'register' ? 'tab-item-active' : ''}`}
              >
                حساب جديد
              </button>
            </div>

            <GoogleSignInButton onCredential={onGoogle} />

            <div className="my-5 flex items-center gap-3 text-xs text-brand-muted">
              <span className="h-px flex-1 bg-brand-sand" />
              أو بالبريد
              <span className="h-px flex-1 bg-brand-sand" />
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="label-field">الاسم الكامل *</label>
                    <input
                      required
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input-field text-base"
                      placeholder="مثال: أحمد محمد"
                    />
                  </div>
                  <div>
                    <label className="label-field">كود الإحالة (اختياري)</label>
                    <input
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      className="input-field uppercase"
                      autoComplete="off"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="label-field">البريد الإلكتروني *</label>
                <input
                  required
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field text-base"
                  dir="ltr"
                />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label className="label-field mb-0">كلمة المرور *</label>
                  {mode === 'login' && (
                    <Link
                      to="/forgot-password"
                      className="text-xs font-semibold text-primary-700 hover:underline"
                    >
                      نسيت كلمة المرور؟
                    </Link>
                  )}
                </div>
                <input
                  required
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field text-base"
                />
                {mode === 'register' && (
                  <p className="mt-1 text-xs text-brand-muted">8 أحرف على الأقل، حرف ورقم</p>
                )}
              </div>
              {mode === 'register' && (
                <>
                  <label className="flex min-h-11 items-start gap-2 text-sm text-brand-ink">
                    <input
                      type="checkbox"
                      required
                      defaultChecked
                      className="mt-1 rounded border-brand-sand text-primary-600"
                    />
                    أؤكد أن عمري 13 سنة أو أكثر
                  </label>
                  <label className="flex min-h-11 items-start gap-2 text-sm text-brand-ink">
                    <input type="checkbox" required className="mt-1 rounded border-brand-sand text-primary-600" />
                    <span>
                      أوافق على{' '}
                      <Link to="/pages/terms-and-conditions" className="text-primary underline" target="_blank">
                        الشروط والأحكام
                      </Link>{' '}
                      و
                      <Link to="/pages/privacy-policy" className="text-primary underline" target="_blank">
                        سياسة الخصوصية
                      </Link>
                    </span>
                  </label>
                </>
              )}
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-100">
                  {error}
                </p>
              )}
              <button type="submit" className="btn-primary w-full py-3.5 text-base">
                <Icon icon={mode === 'login' ? 'mdi:login' : 'mdi:account-plus'} />
                {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}
              </button>
            </form>

            <Link to="/" className="btn-ghost mt-6 w-full justify-center">
              العودة للرئيسية
            </Link>
          </div>
        </motion.div>
      </Container>
    </Layout>
  );
}
