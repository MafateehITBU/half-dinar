import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { changePasswordSchema } from '@half-dinar/shared';
import { Layout } from '../components/Layout';
import { PageTransition } from '../components/PageTransition';
import { Container } from '../components/ui/Container';
import { PageHero } from '../components/ui/PageHero';
import { api, clearAuth, isLoggedIn } from '../lib/api';
import { confirmAction, showError, showSuccess } from '../lib/toast';

interface LoyaltyData {
  pointsBalance: number;
  redeemRate: number;
  earnRate: number;
  transactions: Array<{ type: string; points: number; description: string | null; createdAt: string }>;
}

interface ReferralData {
  code: string;
  shareUrl: string;
  stats: { total: number; rewarded: number; pending: number };
}

interface ProfileData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  locale: string;
  pointsBalance: number;
  emailVerifiedAt: string | null;
  referralCode: string;
  createdAt: string;
}

type Tab = 'profile' | 'password' | 'loyalty' | 'referral';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'profile', label: 'الملف الشخصي', icon: 'mdi:account-outline' },
  { id: 'password', label: 'كلمة المرور', icon: 'mdi:lock-outline' },
  { id: 'loyalty', label: 'الولاء', icon: 'mdi:star-circle-outline' },
  { id: 'referral', label: 'الإحالة', icon: 'mdi:account-multiple-outline' },
];

export function AccountPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('profile');
  const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null);
  const [referral, setReferral] = useState<ReferralData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) return;
    api.getLoyalty().then((r) => setLoyalty(r.data as LoyaltyData));
    api.getReferral().then((r) => setReferral(r.data as ReferralData));
    api.getProfile().then((r) => {
      const p = r.data as ProfileData;
      setProfile(p);
      setFirstName(p.firstName);
      setLastName(p.lastName);
      setPhone(p.phone ?? '');
    });
  }, []);

  if (!isLoggedIn()) return <Navigate to="/login?redirect=account" replace />;

  const initials = profile
    ? `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase()
    : '؟';

  const handleLogout = async () => {
    const ok = await confirmAction('تسجيل الخروج', 'هل تريد تسجيل الخروج من حسابك؟', 'خروج');
    if (!ok) return;
    try {
      await api.logout();
    } catch {
      clearAuth();
    }
    showSuccess('تم تسجيل الخروج');
    navigate('/');
  };

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.updateProfile({ firstName, lastName, phone: phone || undefined });
      showSuccess('تم حفظ بياناتك');
      const r = await api.getProfile();
      setProfile(r.data as ProfileData);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'فشل حفظ البيانات');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showError('كلمة المرور الجديدة غير متطابقة');
      return;
    }
    const parsed = changePasswordSchema.safeParse({ currentPassword, newPassword });
    if (!parsed.success) {
      showError(parsed.error.errors[0]?.message ?? 'تحقق من كلمة المرور');
      return;
    }
    setSavingPassword(true);
    try {
      await api.changePassword(parsed.data.currentPassword, parsed.data.newPassword);
      showSuccess('تم تغيير كلمة المرور');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'فشل تغيير كلمة المرور');
    } finally {
      setSavingPassword(false);
    }
  };

  const copyCode = () => {
    if (referral?.code) {
      navigator.clipboard.writeText(referral.code);
      setCopied(true);
      showSuccess('تم نسخ كود الإحالة');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Layout>
      <PageTransition>
        <Container narrow className="space-y-6 py-8">
          <PageHero compact title="حسابي" subtitle="إدارة بياناتك ونقاط الولاء والإحالة" breadcrumbs={[{ label: 'الرئيسية', to: '/' }]} />
          {/* Profile hero */}
          <div className="glass-card mb-6 overflow-hidden p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-page-hero text-2xl font-bold text-white shadow-glow ring-2 ring-brand-gold/30">
                  {initials}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-brand-ink">
                    {profile ? `${profile.firstName} ${profile.lastName}` : 'حسابي'}
                  </h1>
                  <p className="text-sm text-brand-muted">{profile?.email ?? '...'}</p>
                  {profile && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {profile.emailVerifiedAt ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          <Icon icon="mdi:check-decagram" />
                          بريد مفعّل
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                          <Icon icon="mdi:email-alert-outline" />
                          البريد غير مفعّل
                        </span>
                      )}
                      {loyalty && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-800">
                          <Icon icon="mdi:star" />
                          {loyalty.pointsBalance} نقطة
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <button type="button" onClick={handleLogout} className="btn-secondary shrink-0 text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700">
                <Icon icon="mdi:logout" className="text-lg" />
                تسجيل الخروج
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 border-t border-brand-sand pt-6">
              <Link to="/orders" className="btn-primary text-xs">
                <Icon icon="mdi:clipboard-list-outline" />
                طلباتي
              </Link>
              <Link to="/wishlist" className="btn-secondary text-xs">
                <Icon icon="mdi:heart-outline" />
                المفضلة
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-brand-sand/80 bg-white/90 p-1 shadow-card">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  tab === t.id ? 'bg-primary-600 text-white shadow-glow' : 'text-brand-muted hover:bg-brand-cream'
                }`}
              >
                <Icon icon={t.icon} className="text-lg" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab panels */}
          <div className="glass-card p-6 sm:p-8">
            {tab === 'profile' && (
              <div>
                <h2 className="text-lg font-bold text-brand-ink">بيانات الحساب</h2>
                <p className="mt-1 text-sm text-brand-muted">حدّث اسمك ورقم هاتفك للتوصيل</p>
                {profile ? (
                  <form onSubmit={saveProfile} className="mt-6 space-y-4">
                    <div>
                      <label className="label-field">البريد الإلكتروني</label>
                      <input type="email" value={profile.email} disabled className="input-field bg-brand-cream text-brand-muted" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="label-field">الاسم الأول</label>
                        <input
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="label-field">اسم العائلة</label>
                        <input
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="input-field"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="label-field">الهاتف</label>
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="input-field"
                        placeholder="07XXXXXXXX"
                        dir="ltr"
                      />
                    </div>
                    <button type="submit" disabled={savingProfile} className="btn-primary">
                      {savingProfile ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                    </button>
                  </form>
                ) : (
                  <p className="mt-4 text-brand-muted">جاري التحميل...</p>
                )}
              </div>
            )}

            {tab === 'password' && (
              <div>
                <h2 className="text-lg font-bold text-brand-ink">تغيير كلمة المرور</h2>
                <p className="mt-1 text-sm text-brand-muted">استخدم 8 أحرف على الأقل مع حرف كبير وصغير ورقم</p>
                <form onSubmit={savePassword} className="mt-6 max-w-md space-y-4">
                  <div>
                    <label className="label-field">كلمة المرور الحالية</label>
                    <div className="relative">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="input-field pl-12"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted"
                        onClick={() => setShowCurrent((v) => !v)}
                        tabIndex={-1}
                      >
                        <Icon icon={showCurrent ? 'mdi:eye-off-outline' : 'mdi:eye-outline'} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="label-field">كلمة المرور الجديدة</label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input-field pl-12"
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted"
                        onClick={() => setShowNew((v) => !v)}
                        tabIndex={-1}
                      >
                        <Icon icon={showNew ? 'mdi:eye-off-outline' : 'mdi:eye-outline'} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="label-field">تأكيد كلمة المرور الجديدة</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-field"
                      required
                      autoComplete="new-password"
                    />
                  </div>
                  <button type="submit" disabled={savingPassword} className="btn-primary">
                    {savingPassword ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
                  </button>
                </form>
                <p className="mt-6 text-sm text-brand-muted">
                  نسيت كلمة المرور؟{' '}
                  <Link to="/forgot-password" className="font-medium text-primary-700 hover:underline">
                    استعادة عبر البريد
                  </Link>
                </p>
              </div>
            )}

            {tab === 'loyalty' && (
              <div>
                <h2 className="text-lg font-bold text-brand-ink">نقاط الولاء</h2>
                {loyalty ? (
                  <>
                    <p className="mt-4 text-4xl font-bold text-primary-700">{loyalty.pointsBalance}</p>
                    <p className="text-sm text-brand-muted">نقطة متاحة</p>
                    <p className="mt-2 text-sm text-brand-muted">
                      اكسب {loyalty.earnRate} نقطة لكل 1 د.أ — استبدل {loyalty.redeemRate} نقطة = 1 د.أ خصم عند الدفع
                    </p>
                    {loyalty.transactions.length > 0 && (
                      <ul className="mt-6 divide-y divide-brand-sand rounded-xl border border-brand-sand">
                        {loyalty.transactions.map((t, i) => (
                          <li key={`${t.createdAt}-${i}`} className="flex justify-between px-4 py-3 text-sm">
                            <span className="text-brand-ink">{t.description ?? t.type}</span>
                            <span className={`font-semibold ${t.points >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {t.points > 0 ? '+' : ''}
                              {t.points}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <p className="mt-4 text-brand-muted">جاري التحميل...</p>
                )}
              </div>
            )}

            {tab === 'referral' && (
              <div>
                <h2 className="text-lg font-bold text-brand-ink">ادعُ أصدقاءك</h2>
                {referral ? (
                  <>
                    <p className="mt-4 font-mono text-3xl font-bold tracking-wider text-primary-700">{referral.code}</p>
                    <button type="button" onClick={copyCode} className="btn-secondary mt-3">
                      <Icon icon={copied ? 'mdi:check' : 'mdi:content-copy'} />
                      {copied ? 'تم النسخ' : 'نسخ الكود'}
                    </button>
                    <p className="mt-6 text-sm text-brand-muted">
                      مكافآت: {referral.stats.rewarded} مكتملة · {referral.stats.pending} قيد الانتظار · {referral.stats.total}{' '}
                      إجمالي
                    </p>
                    <p className="mt-3 break-all rounded-lg bg-brand-cream p-3 text-xs text-brand-muted">{referral.shareUrl}</p>
                  </>
                ) : (
                  <p className="mt-4 text-brand-muted">جاري التحميل...</p>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 text-center sm:hidden">
            <button type="button" onClick={handleLogout} className="text-sm font-medium text-red-600 hover:underline">
              تسجيل الخروج
            </button>
          </div>
        </Container>
      </PageTransition>
    </Layout>
  );
}
