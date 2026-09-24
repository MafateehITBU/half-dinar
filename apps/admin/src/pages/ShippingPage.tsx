import { FormEvent, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { AdminLayout } from '../components/AdminLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, type Column } from '../components/ui/DataTable';
import { adminApi } from '../lib/api';
import { showToastError, showToastSuccess } from '../lib/confirm';

interface ShippingZoneRow {
  id: string;
  nameAr: string;
  nameEn: string;
  governorateCode: string;
  isActive: boolean;
  flatRate: number;
  rateId: string | null;
}

export function ShippingPage() {
  const [zones, setZones] = useState<ShippingZoneRow[]>([]);
  const [threshold, setThreshold] = useState('50');
  const [draftRates, setDraftRates] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingThreshold, setSavingThreshold] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const load = async () => {
    setError('');
    const r = await adminApi.getShippingZones();
    const data = r.data as { freeShippingThreshold: number; zones: ShippingZoneRow[] };
    setZones(data.zones ?? []);
    setThreshold(String(data.freeShippingThreshold ?? 50));
    const drafts: Record<string, string> = {};
    for (const z of data.zones ?? []) drafts[z.id] = String(z.flatRate);
    setDraftRates(drafts);
  };

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : 'فشل التحميل'));
  }, []);

  const saveRate = async (zone: ShippingZoneRow) => {
    setError('');
    setOk('');
    setSavingId(zone.id);
    try {
      const raw = (draftRates[zone.id] ?? '').trim();
      if (raw === '') throw new Error('أدخل سعر الشحن (0 = مجاني لهذه المحافظة)');
      const flatRate = Number(raw);
      if (!Number.isFinite(flatRate) || flatRate < 0) throw new Error('سعر غير صالح');
      await adminApi.updateShippingZone(zone.id, { flatRate });
      setOk(
        flatRate === 0
          ? `تم جعل شحن ${zone.nameAr} مجاناً`
          : `تم حفظ شحن ${zone.nameAr}`,
      );
      await showToastSuccess(
        flatRate === 0
          ? `تم جعل شحن ${zone.nameAr} مجاناً`
          : `تم حفظ شحن ${zone.nameAr}`,
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل الحفظ');
      await showToastError(e instanceof Error ? e.message : 'فشل الحفظ');
    } finally {
      setSavingId(null);
    }
  };

  const toggleActive = async (zone: ShippingZoneRow) => {
    setError('');
    setOk('');
    setSavingId(zone.id);
    try {
      await adminApi.updateShippingZone(zone.id, { isActive: !zone.isActive });
      setOk(zone.isActive ? `تم إيقاف ${zone.nameAr}` : `تم تفعيل ${zone.nameAr}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل التحديث');
    } finally {
      setSavingId(null);
    }
  };

  const saveThreshold = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setOk('');
    setSavingThreshold(true);
    try {
      const freeShippingThreshold = Number(threshold);
      if (Number.isNaN(freeShippingThreshold) || freeShippingThreshold < 0) {
        throw new Error('حد الشحن المجاني غير صالح');
      }
      await adminApi.updateShippingSettings({ freeShippingThreshold });
      setOk('تم حفظ حد الشحن المجاني');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الحفظ');
    } finally {
      setSavingThreshold(false);
    }
  };

  const columns: Column<ShippingZoneRow>[] = [
    {
      key: 'nameAr',
      header: 'المحافظة',
      render: (z) => (
        <div>
          <p className="font-semibold">{z.nameAr}</p>
          <p className="text-xs text-brand-muted">{z.nameEn} · {z.governorateCode}</p>
        </div>
      ),
    },
    {
      key: 'flatRate',
      header: 'سعر الشحن (د.أ)',
      render: (z) => (
        <input
          type="number"
          min={0}
          step="0.1"
          value={draftRates[z.id] ?? ''}
          onChange={(e) => setDraftRates((d) => ({ ...d, [z.id]: e.target.value }))}
          className="w-28 rounded-lg border border-brand-sand px-2 py-1.5 text-sm"
        />
      ),
    },
    {
      key: 'isActive',
      header: 'الحالة',
      render: (z) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            z.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
          }`}
        >
          {z.isActive ? 'مفعّل' : 'متوقف'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (z) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={savingId === z.id}
            onClick={() => saveRate(z)}
            className="rounded-lg bg-brand-green px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
          >
            حفظ السعر
          </button>
          <button
            type="button"
            disabled={savingId === z.id}
            onClick={() => toggleActive(z)}
            className="rounded-lg border border-brand-sand px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
          >
            {z.isActive ? 'إيقاف' : 'تفعيل'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="أسعار الشحن"
        description="سعر 0 = شحن مجاني للمحافظة. زر إيقاف يعطّل المحافظة بالكامل (العميل لن يستطيع اختيارها عند الدفع)."
      />

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}
      {ok && (
        <p className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-800">{ok}</p>
      )}

      <form
        onSubmit={saveThreshold}
        className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-brand-sand bg-white p-5 shadow-sm"
      >
        <label className="text-sm font-semibold">
          حد الشحن المجاني (د.أ)
          <input
            type="number"
            min={0}
            step="1"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="mt-1 block w-40 rounded-lg border border-brand-sand px-3 py-2"
          />
        </label>
        <p className="max-w-sm text-xs text-brand-muted">
          إذا بلغ مجموع السلة هذا المبلغ أو أكثر، يصبح الشحن مجاناً عند الدفع.
        </p>
        <button
          type="submit"
          disabled={savingThreshold}
          className="rounded-xl bg-brand-gold px-4 py-2 text-sm font-bold text-brand-ink disabled:opacity-50"
        >
          {savingThreshold ? '...' : 'حفظ الحد'}
        </button>
      </form>

      <div className="rounded-2xl border border-brand-sand bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm text-brand-muted">
          <Icon icon="mdi:truck-outline" className="text-lg text-brand-green" />
          {zones.length} محافظة
        </div>
        <DataTable columns={columns} data={zones} rowKey={(z) => z.id} emptyMessage="لا توجد مناطق شحن" />
      </div>
    </AdminLayout>
  );
}
