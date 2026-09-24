import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { formatMoney, toNum } from '@half-dinar/shared';
import { AdminLayout } from '../components/AdminLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, type BulkAction, type Column } from '../components/ui/DataTable';
import { TableActions } from '../components/ui/TableActions';
import { Badge } from '../components/ui/Badge';
import { useTableSelection } from '../hooks/useTableSelection';
import { reportBulkResult } from '../lib/bulk';
import { confirmDelete, showToastSuccess, showWarning } from '../lib/confirm';
import { ProductMultiPicker } from '../components/ProductMultiPicker';
import type { PickerProduct } from '../components/ProductPicker';
import { adminApi } from '../lib/api';

type Tab = 'campaigns' | 'coupons';

interface CouponRow {
  id: string;
  code: string;
  type: string;
  value: number | string;
  minOrderValue?: number | string | null;
  usedCount: number;
  isActive?: boolean;
}

interface CampaignRow {
  id: string;
  name: string;
  type: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  products?: Array<{
    discountPercent: number;
    product: { id: string; nameAr: string; sku: string };
  }>;
}

const COUPON_TYPE_AR: Record<string, string> = {
  percent: 'نسبة مئوية',
  fixed: 'مبلغ ثابت',
  free_shipping: 'توصيل مجاني',
};

const CAMPAIGN_TYPE_AR: Record<string, string> = {
  flash: 'عرض سريع (Flash)',
  seasonal: 'موسمي',
  holiday: 'مناسبة / عطلة',
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/** Value for `<input type="datetime-local">` */
function toDatetimeLocal(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultCampaignDates() {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  end.setHours(23, 59, 0, 0);
  return { startsAt: toDatetimeLocal(start), endsAt: toDatetimeLocal(end) };
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ar-JO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function campaignStatus(c: CampaignRow): { label: string; variant: 'success' | 'warning' | 'default' | 'danger' } {
  const now = Date.now();
  const start = new Date(c.startsAt).getTime();
  const end = new Date(c.endsAt).getTime();
  if (!c.isActive) return { label: 'معطّلة', variant: 'danger' };
  if (now < start) return { label: 'لم تبدأ بعد', variant: 'warning' };
  if (now > end) return { label: 'منتهية', variant: 'default' };
  return { label: 'نشطة الآن', variant: 'success' };
}

function emptyCampForm() {
  const dates = defaultCampaignDates();
  return {
    name: '',
    type: 'flash' as const,
    discountPercent: '15',
    ...dates,
  };
}

export function PromotionsPage() {
  const [tab, setTab] = useState<Tab>('campaigns');
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [pickerProducts, setPickerProducts] = useState<PickerProduct[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [campProductIds, setCampProductIds] = useState<string[]>([]);
  const [campSaving, setCampSaving] = useState(false);

  const [couponForm, setCouponForm] = useState({ code: '', type: 'percent', value: '10', minOrderValue: '5' });
  const [campForm, setCampForm] = useState(emptyCampForm);

  const { selectedIds: selectedCouponIds, setSelectedIds: setSelectedCouponIds, clearSelection: clearCoupons } =
    useTableSelection(coupons);
  const { selectedIds: selectedCampaignIds, setSelectedIds: setSelectedCampaignIds, clearSelection: clearCampaigns } =
    useTableSelection(campaigns);

  const activeCampaigns = useMemo(
    () => campaigns.filter((c) => campaignStatus(c).variant === 'success').length,
    [campaigns],
  );

  const load = async () => {
    const [c, camp, picker] = await Promise.all([
      adminApi.getCoupons(),
      adminApi.getCampaigns(),
      adminApi.getProductPicker(),
    ]);
    setCoupons(c.data as CouponRow[]);
    setCampaigns(camp.data as CampaignRow[]);
    setPickerProducts(picker.data);
  };

  useEffect(() => {
    load();
  }, []);

  const createCoupon = async (e: FormEvent) => {
    e.preventDefault();
    await adminApi.createCoupon({
      code: couponForm.code.toUpperCase(),
      type: couponForm.type,
      value: Number(couponForm.value),
      minOrderValue: Number(couponForm.minOrderValue),
      isActive: true,
    });
    setCouponForm({ code: '', type: 'percent', value: '10', minOrderValue: '5' });
    await showToastSuccess('تم إنشاء الكوبون');
    load();
  };

  const createCampaign = async (e: FormEvent) => {
    e.preventDefault();
    if (campProductIds.length === 0) {
      void showWarning('اختر منتجاً واحداً على الأقل للعرض');
      return;
    }

    const startsAt = new Date(campForm.startsAt);
    const endsAt = new Date(campForm.endsAt);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      void showWarning('تحقق من تاريخ البداية والنهاية');
      return;
    }
    if (endsAt <= startsAt) {
      void showWarning('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
      return;
    }

    setCampSaving(true);
    try {
      await adminApi.createCampaign({
        name: campForm.name.trim(),
        type: campForm.type,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        isActive: true,
        discountPercent: Number(campForm.discountPercent),
        productIds: campProductIds,
      });
      setCampForm(emptyCampForm());
      setCampProductIds([]);
      await showToastSuccess('تم إنشاء العرض');
      load();
    } finally {
      setCampSaving(false);
    }
  };

  const couponColumns: Column<CouponRow>[] = [
    { key: 'code', header: 'كود الكوبون', render: (c) => <span className="font-mono font-semibold">{c.code}</span> },
    { key: 'type', header: 'نوع الخصم', render: (c) => COUPON_TYPE_AR[c.type] ?? c.type },
    {
      key: 'value',
      header: 'القيمة',
      render: (c) =>
        c.type === 'percent'
          ? `${toNum(c.value)}%`
          : c.type === 'free_shipping'
            ? '—'
            : `${formatMoney(c.value)} د.أ`,
    },
    {
      key: 'min',
      header: 'حد أدنى للطلب',
      render: (c) => (c.minOrderValue != null && c.minOrderValue !== '' ? `${formatMoney(c.minOrderValue)} د.أ` : '—'),
    },
    { key: 'used', header: 'مرات الاستخدام', render: (c) => c.usedCount },
    {
      key: 'status',
      header: 'الحالة',
      render: (c) => (
        <Badge variant={c.isActive !== false ? 'success' : 'default'}>{c.isActive !== false ? 'فعّال' : 'معطّل'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'إجراءات',
      render: (c) => (
        <TableActions
          actions={[
            {
              label: 'حذف',
              icon: 'mdi:delete-outline',
              variant: 'danger',
              onClick: async () => {
                if (await confirmDelete(`حذف الكوبون ${c.code}؟`)) {
                  await adminApi.deleteCoupon(c.id);
                  load();
                }
              },
            },
          ]}
        />
      ),
    },
  ];

  const couponBulkActions: BulkAction[] = [
    {
      id: 'delete',
      label: 'حذف الكوبونات',
      icon: 'mdi:delete-outline',
      variant: 'danger',
      confirm: 'حذف {count} كوبون؟',
      onAction: async (ids) => {
        const { data } = await adminApi.bulkDeleteCoupons(ids);
        await reportBulkResult(data, 'حذف الكوبونات');
        clearCoupons();
        load();
      },
    },
  ];

  const campaignColumns: Column<CampaignRow>[] = [
    { key: 'name', header: 'اسم العرض', render: (c) => <span className="font-medium">{c.name}</span> },
    { key: 'type', header: 'النوع', render: (c) => CAMPAIGN_TYPE_AR[c.type] ?? c.type },
    {
      key: 'discount',
      header: 'الخصم',
      render: (c) => {
        const pct = c.products?.[0]?.discountPercent;
        return pct ? `${pct}%` : '—';
      },
    },
    {
      key: 'products',
      header: 'المنتجات',
      render: (c) => `${c.products?.length ?? 0} منتج`,
    },
    {
      key: 'period',
      header: 'فترة العرض',
      render: (c) => (
        <div className="text-xs leading-relaxed text-slate-600">
          <div>
            <span className="font-medium text-slate-700">من:</span> {formatDateTime(c.startsAt)}
          </div>
          <div>
            <span className="font-medium text-slate-700">إلى:</span> {formatDateTime(c.endsAt)}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'الحالة',
      render: (c) => {
        const s = campaignStatus(c);
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'إجراءات',
      render: (c) => (
        <TableActions
          actions={[
            {
              label: 'حذف',
              icon: 'mdi:delete-outline',
              variant: 'danger',
              onClick: async () => {
                if (await confirmDelete(`حذف عرض «${c.name}»؟`)) {
                  await adminApi.deleteCampaign(c.id);
                  load();
                }
              },
            },
          ]}
        />
      ),
    },
  ];

  const campaignBulkActions: BulkAction[] = [
    {
      id: 'delete',
      label: 'حذف العروض',
      icon: 'mdi:delete-outline',
      variant: 'danger',
      confirm: 'حذف {count} عرض؟',
      onAction: async (ids) => {
        const { data } = await adminApi.bulkDeleteCampaigns(ids);
        await reportBulkResult(data, 'حذف العروض');
        clearCampaigns();
        load();
      },
    },
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="العروض والخصومات"
        description="عروض المنتجات (Flash) تظهر في المتجر بسعر مخفّض — الكوبونات يدخلها العميل عند الدفع"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab('campaigns')}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${
            tab === 'campaigns'
              ? 'bg-primary text-white shadow-sm'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Icon icon="mdi:flash-outline" className="text-lg" />
          عروض المنتجات
          {activeCampaigns > 0 && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{activeCampaigns} نشط</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab('coupons')}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${
            tab === 'coupons'
              ? 'bg-primary text-white shadow-sm'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Icon icon="mdi:ticket-percent-outline" className="text-lg" />
          كوبونات الخصم
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{coupons.length}</span>
        </button>
      </div>

      {tab === 'campaigns' && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="admin-card flex gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Icon icon="mdi:flash" className="text-xl" />
              </span>
              <div>
                <p className="font-bold text-slate-900">عرض سريع على منتجات</p>
                <p className="mt-0.5 text-xs text-slate-500">يُطبَّق تلقائياً على السعر في المتجر والسلة خلال الفترة المحددة</p>
              </div>
            </div>
            <div className="admin-card flex gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Icon icon="mdi:calendar-range" className="text-xl" />
              </span>
              <div>
                <p className="font-bold text-slate-900">أنت تحدّد الفترة</p>
                <p className="mt-0.5 text-xs text-slate-500">تاريخ ووقت البداية والنهاية — ليس مقيداً بأسبوع</p>
              </div>
            </div>
            <div className="admin-card flex gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-800">
                <Icon icon="mdi:package-variant" className="text-xl" />
              </span>
              <div>
                <p className="font-bold text-slate-900">{campaigns.length} عرض مسجّل</p>
                <p className="mt-0.5 text-xs text-slate-500">{activeCampaigns} نشط حالياً في المتجر</p>
              </div>
            </div>
          </div>

          <section className="admin-card mb-8 p-6 sm:p-8">
            <h3 className="mb-1 flex items-center gap-2 text-lg font-bold text-slate-900">
              <Icon icon="mdi:plus-circle-outline" className="text-primary text-xl" />
              إنشاء عرض جديد
            </h3>
            <p className="mb-6 text-sm text-slate-500">اختر المنتجات، نسبة الخصم، وحدّد متى يبدأ العرض ومتى ينتهي</p>

            <form onSubmit={createCampaign} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="block sm:col-span-2 lg:col-span-1">
                  <span className="mb-1 block text-xs font-medium text-slate-600">اسم العرض *</span>
                  <input
                    required
                    className="input-field"
                    placeholder="مثال: عروض رمضان"
                    value={campForm.name}
                    onChange={(e) => setCampForm({ ...campForm, name: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">نوع العرض</span>
                  <select
                    className="select-field"
                    value={campForm.type}
                    onChange={(e) => setCampForm({ ...campForm, type: e.target.value as typeof campForm.type })}
                  >
                    <option value="flash">عرض سريع (Flash)</option>
                    <option value="seasonal">موسمي</option>
                    <option value="holiday">مناسبة / عطلة</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">نسبة الخصم % *</span>
                  <input
                    required
                    type="number"
                    min="1"
                    max="90"
                    className="input-field"
                    dir="ltr"
                    value={campForm.discountPercent}
                    onChange={(e) => setCampForm({ ...campForm, discountPercent: e.target.value })}
                  />
                </label>
              </div>

              <fieldset className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <legend className="px-2 text-sm font-bold text-slate-800">فترة العرض *</legend>
                <div className="mt-2 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-600">
                      <Icon icon="mdi:calendar-start" />
                      يبدأ في
                    </span>
                    <input
                      required
                      type="datetime-local"
                      className="input-field"
                      dir="ltr"
                      value={campForm.startsAt}
                      onChange={(e) => setCampForm({ ...campForm, startsAt: e.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-600">
                      <Icon icon="mdi:calendar-end" />
                      ينتهي في
                    </span>
                    <input
                      required
                      type="datetime-local"
                      className="input-field"
                      dir="ltr"
                      value={campForm.endsAt}
                      min={campForm.startsAt}
                      onChange={(e) => setCampForm({ ...campForm, endsAt: e.target.value })}
                    />
                  </label>
                </div>
                <p className="mt-2 text-xs text-slate-500">العرض يظهر في المتجر فقط بين هذين التاريخين (حسب توقيت جهازك)</p>
              </fieldset>

              <fieldset>
                <legend className="mb-3 text-sm font-bold text-slate-800">المنتجات المشمولة بالعرض *</legend>
                <ProductMultiPicker
                  products={pickerProducts}
                  selectedIds={campProductIds}
                  onChange={setCampProductIds}
                  search={productSearch}
                  onSearchChange={setProductSearch}
                />
              </fieldset>

              <button type="submit" className="btn-primary" disabled={campSaving || pickerProducts.length === 0}>
                <Icon icon="mdi:flash" />
                {campSaving ? 'جاري الإنشاء...' : 'إنشاء العرض'}
              </button>
            </form>
          </section>

          <section>
            <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
              <Icon icon="mdi:format-list-bulleted" />
              العروض الحالية ({campaigns.length})
            </h3>
            <DataTable
              columns={campaignColumns}
              data={campaigns}
              rowKey={(c) => c.id}
              emptyMessage="لا توجد عروض — أنشئ عرضاً جديداً أعلاه"
              selectable
              selectedIds={selectedCampaignIds}
              onSelectedIdsChange={setSelectedCampaignIds}
              bulkActions={campaignBulkActions}
            />
          </section>
        </>
      )}

      {tab === 'coupons' && (
        <>
          <div className="mb-6 admin-card flex gap-3 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-800">
              <Icon icon="mdi:ticket-percent" className="text-xl" />
            </span>
            <div>
              <p className="font-bold text-slate-900">كوبونات الخصم</p>
              <p className="mt-0.5 text-sm text-slate-500">
                كود يُدخله العميل عند الدفع — منفصل عن عروض المنتجات. يدعم نسبة، مبلغ ثابت، أو توصيل مجاني.
              </p>
            </div>
          </div>

          <section className="admin-card mb-8 p-6 sm:p-8">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
              <Icon icon="mdi:ticket-plus-outline" />
              كوبون جديد
            </h3>
            <form onSubmit={createCoupon} className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">كود الكوبون *</span>
                <input
                  required
                  className="input-field font-mono uppercase"
                  dir="ltr"
                  placeholder="مثال: SUMMER20"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">نوع الخصم</span>
                <select
                  className="select-field"
                  value={couponForm.type}
                  onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value })}
                >
                  <option value="percent">نسبة مئوية %</option>
                  <option value="fixed">مبلغ ثابت (د.أ)</option>
                  <option value="free_shipping">توصيل مجاني</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">قيمة الخصم</span>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  dir="ltr"
                  disabled={couponForm.type === 'free_shipping'}
                  value={couponForm.value}
                  onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">الحد الأدنى للطلب (د.أ)</span>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  dir="ltr"
                  value={couponForm.minOrderValue}
                  onChange={(e) => setCouponForm({ ...couponForm, minOrderValue: e.target.value })}
                />
              </label>
              <button type="submit" className="btn-primary sm:col-span-2">
                <Icon icon="mdi:plus" />
                إضافة كوبون
              </button>
            </form>
          </section>

          <section>
            <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
              <Icon icon="mdi:format-list-bulleted" />
              الكوبونات ({coupons.length})
            </h3>
            <DataTable
              columns={couponColumns}
              data={coupons}
              rowKey={(c) => c.id}
              emptyMessage="لا توجد كوبونات"
              selectable
              selectedIds={selectedCouponIds}
              onSelectedIdsChange={setSelectedCouponIds}
              bulkActions={couponBulkActions}
            />
          </section>
        </>
      )}
    </AdminLayout>
  );
}
