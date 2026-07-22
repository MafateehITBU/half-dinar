import { FormEvent, useEffect, useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { RichTextEditor } from '../components/RichTextEditor';
import { adminApi } from '../lib/api';

export function SettingsPage() {
  const [form, setForm] = useState({
    ga4_measurement_id: '',
    meta_pixel_id: '',
    cookie_banner_text_ar: '',
    loyalty_earn_rate: '1',
    loyalty_redeem_rate: '100',
    referral_referrer_reward_jod: '5',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminApi.getSettings().then((r) => {
      const d = r.data as Record<string, unknown>;
      const loyalty = d.loyalty as { earnRate?: number; redeemRate?: number };
      setForm({
        ga4_measurement_id: (d.ga4MeasurementId as string) ?? '',
        meta_pixel_id: (d.metaPixelId as string) ?? '',
        cookie_banner_text_ar: (d.cookieBanner as { ar?: string })?.ar ?? '',
        loyalty_earn_rate: String(loyalty?.earnRate ?? 1),
        loyalty_redeem_rate: String(loyalty?.redeemRate ?? 100),
        referral_referrer_reward_jod: '5',
      });
    });
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await adminApi.updateSettings({
      ga4_measurement_id: form.ga4_measurement_id,
      meta_pixel_id: form.meta_pixel_id,
      cookie_banner_text_ar: form.cookie_banner_text_ar,
      loyalty_earn_rate: Number(form.loyalty_earn_rate),
      loyalty_redeem_rate: Number(form.loyalty_redeem_rate),
      referral_referrer_reward_jod: Number(form.referral_referrer_reward_jod),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <AdminLayout>
      <h2 className="mb-6 text-2xl font-bold">الإعدادات والتسويق</h2>
      <form onSubmit={onSubmit} className="max-w-xl space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <label className="block text-sm">
          GA4 Measurement ID
          <input
            value={form.ga4_measurement_id}
            onChange={(e) => setForm({ ...form, ga4_measurement_id: e.target.value })}
            placeholder="G-XXXXXXXX"
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Meta Pixel ID
          <input
            value={form.meta_pixel_id}
            onChange={(e) => setForm({ ...form, meta_pixel_id: e.target.value })}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          نص موافقة الكوكيز (AR)
          <div className="mt-1">
            <RichTextEditor
              value={form.cookie_banner_text_ar}
              onChange={(html) => setForm({ ...form, cookie_banner_text_ar: html })}
              minHeight="72px"
            />
          </div>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            نقاط / د.أ (اكسب)
            <input value={form.loyalty_earn_rate} onChange={(e) => setForm({ ...form, loyalty_earn_rate: e.target.value })} className="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <label className="text-sm">
            نقاط = 1 د.أ (استبدال)
            <input value={form.loyalty_redeem_rate} onChange={(e) => setForm({ ...form, loyalty_redeem_rate: e.target.value })} className="mt-1 w-full rounded border px-3 py-2" />
          </label>
        </div>
        <label className="block text-sm">
          مكافأة الإحالة (د.أ)
          <input value={form.referral_referrer_reward_jod} onChange={(e) => setForm({ ...form, referral_referrer_reward_jod: e.target.value })} className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <button type="submit" className="rounded bg-primary px-6 py-2 text-white">حفظ</button>
        {saved && <span className="text-sm text-green-600">تم الحفظ</span>}
      </form>
    </AdminLayout>
  );
}
