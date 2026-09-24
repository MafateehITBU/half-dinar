import { FormEvent, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { JORDAN_GOVERNORATES, createAddressSchema } from '@half-dinar/shared';
import { api, type SavedAddress } from '../lib/api';
import { formatZodErrors } from '../lib/errors';
import { confirmAction, showError, showSuccess } from '../lib/toast';

const emptyForm = {
  label: 'المنزل',
  governorate: 'عمان',
  city: '',
  street: '',
  building: '',
  phone: '',
  isDefault: false,
};

export function AccountAddressesPanel() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [govCode, setGovCode] = useState('AM');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .getAddresses()
      .then((r) => setAddresses(r.data))
      .catch((err) => showError(err instanceof Error ? err.message : 'تعذر تحميل العناوين'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const onGov = (code: string) => {
    setGovCode(code);
    const g = JORDAN_GOVERNORATES.find((x) => x.code === code);
    if (g) setForm((f) => ({ ...f, governorate: g.nameAr }));
  };

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = createAddressSchema.safeParse(form);
    if (!parsed.success) {
      showError(formatZodErrors(parsed.error));
      return;
    }
    setSaving(true);
    try {
      await api.createAddress(parsed.data);
      showSuccess('تم حفظ العنوان');
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'فشل حفظ العنوان');
    } finally {
      setSaving(false);
    }
  };

  const onDefault = async (id: string) => {
    try {
      await api.setDefaultAddress(id);
      showSuccess('تم تعيين العنوان الافتراضي');
      load();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'فشل التعيين');
    }
  };

  const onDelete = async (id: string) => {
    const ok = await confirmAction('حذف العنوان', 'هل تريد حذف هذا العنوان؟', 'حذف');
    if (!ok) return;
    try {
      await api.deleteAddress(id);
      showSuccess('تم الحذف');
      load();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'فشل الحذف');
    }
  };

  if (loading) {
    return <p className="text-sm text-brand-muted">جاري تحميل العناوين…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-brand-ink">عناوين التوصيل</h2>
          <p className="text-sm text-brand-muted">احفظ عناوينك لاختيارها بسرعة عند الطلب</p>
        </div>
        <button
          type="button"
          className="btn-primary text-sm"
          onClick={() => setShowForm((v) => !v)}
        >
          <Icon icon={showForm ? 'mdi:close' : 'mdi:plus'} />
          {showForm ? 'إلغاء' : 'عنوان جديد'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={onSave} className="space-y-3 rounded-xl border border-brand-sand bg-brand-cream/40 p-4">
          <div>
            <label className="label-field">التسمية</label>
            <input
              className="input-field text-base"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="المنزل / العمل"
            />
          </div>
          <div>
            <label className="label-field">المحافظة</label>
            <select className="input-field text-base" value={govCode} onChange={(e) => onGov(e.target.value)}>
              {JORDAN_GOVERNORATES.map((g) => (
                <option key={g.code} value={g.code}>
                  {g.nameAr}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">المدينة</label>
            <input
              className="input-field text-base"
              required
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
          </div>
          <div>
            <label className="label-field">الشارع</label>
            <input
              className="input-field text-base"
              required
              value={form.street}
              onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
            />
          </div>
          <div>
            <label className="label-field">البناية (اختياري)</label>
            <input
              className="input-field text-base"
              value={form.building}
              onChange={(e) => setForm((f) => ({ ...f, building: e.target.value }))}
            />
          </div>
          <div>
            <label className="label-field">الهاتف</label>
            <input
              className="input-field text-base"
              required
              inputMode="tel"
              dir="ltr"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
            />
            عنوان افتراضي
          </label>
          <button type="submit" disabled={saving} className="btn-primary w-full py-3 disabled:opacity-60">
            {saving ? 'جاري الحفظ…' : 'حفظ العنوان'}
          </button>
        </form>
      )}

      {addresses.length === 0 && !showForm ? (
        <p className="rounded-xl border border-dashed border-brand-sand p-6 text-center text-sm text-brand-muted">
          لا توجد عناوين محفوظة بعد. أضف عنواناً أو احفظه من صفحة الدفع.
        </p>
      ) : (
        <ul className="space-y-3">
          {addresses.map((a) => (
            <li
              key={a.id}
              className="rounded-xl border border-brand-sand bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-brand-ink">
                    {a.label || 'عنوان'}
                    {a.isDefault && (
                      <span className="ms-2 rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-800">
                        افتراضي
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-brand-muted">
                    {a.governorate} · {a.city} · {a.street}
                    {a.building ? ` · ${a.building}` : ''}
                  </p>
                  <p className="mt-1 text-sm" dir="ltr">
                    {a.phone}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!a.isDefault && (
                    <button type="button" className="btn-ghost text-xs" onClick={() => onDefault(a.id)}>
                      تعيين افتراضي
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-ghost text-xs text-red-600"
                    onClick={() => onDelete(a.id)}
                  >
                    حذف
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
