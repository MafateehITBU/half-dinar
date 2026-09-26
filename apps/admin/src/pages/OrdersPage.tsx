import { FormEvent, useCallback, useMemo, useState } from 'react';
import type { OrderDetail, OrderSummary } from '@half-dinar/shared';
import { formatMoney } from '@half-dinar/shared';
import { AdminLayout } from '../components/AdminLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, type Column } from '../components/ui/DataTable';
import { TableActions } from '../components/ui/TableActions';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { adminApi, openAdminOrderInvoice } from '../lib/api';
import { confirmDelete, showToastError, showToastSuccess } from '../lib/confirm';

const STATUSES = ['pending', 'processing', 'paid', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded'] as const;

const STATUS_AR: Record<string, string> = {
  pending: 'قيد الانتظار',
  processing: 'قيد المعالجة',
  paid: 'مدفوع',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  refunded: 'مسترد',
};

/** Allowed next statuses from current (must match API VALID_TRANSITIONS). */
const NEXT_STATUSES: Record<string, string[]> = {
  pending: ['processing', 'paid', 'cancelled'],
  processing: ['paid', 'shipped', 'cancelled'],
  paid: ['processing', 'shipped', 'cancelled', 'refunded'],
  shipped: ['delivered', 'cancelled'],
  delivered: ['completed', 'refunded'],
  completed: ['refunded'],
  cancelled: [],
  refunded: [],
};

const STATUS_VARIANT: Record<string, 'default' | 'warning' | 'success' | 'primary' | 'danger'> = {
  pending: 'warning',
  processing: 'primary',
  paid: 'success',
  shipped: 'primary',
  delivered: 'success',
  completed: 'success',
  cancelled: 'danger',
  refunded: 'danger',
};

const PAYMENT_STATUS_AR: Record<string, string> = {
  paid: 'مدفوع',
  pending: 'غير مدفوع',
  failed: 'فشل الدفع',
  refunded: 'مسترد',
};

const PAYMENT_STATUS_VARIANT: Record<string, 'default' | 'warning' | 'success' | 'danger'> = {
  paid: 'success',
  pending: 'warning',
  failed: 'danger',
  refunded: 'danger',
};

function paymentMethodLabel(method: string): string {
  if (method === 'cod') return 'الدفع عند الاستلام (COD)';
  if (method === 'meps') return 'بطاقة Visa / Mastercard (MEPS)';
  if (method === 'stripe') return 'بطاقة (Stripe)';
  return method;
}

function paymentSummary(method: string, status: string): string {
  if (method === 'cod') {
    return status === 'paid' ? 'COD — تم التحصيل' : 'COD — يُدفع عند التسليم';
  }
  if (method === 'meps' || method === 'stripe') {
    return status === 'paid' ? 'بطاقة — مدفوع' : status === 'failed' ? 'بطاقة — فشل' : 'بطاقة — بانتظار التأكيد';
  }
  return `${method} / ${status}`;
}

type OrderRow = OrderSummary & {
  customer?: { email: string; firstName: string; lastName: string };
};

function addressLines(addr: Record<string, unknown> | null | undefined): string[] {
  if (!addr) return [];
  return [addr.label, addr.governorate, addr.city, addr.street, addr.building, addr.phone]
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean);
}

export function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [searchApplied, setSearchApplied] = useState('');
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const filters = {
    status: statusFilter || undefined,
    paymentMethod: paymentMethodFilter || undefined,
    paymentStatus: paymentStatusFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    q: searchApplied || undefined,
  };

  const fetchOrders = useCallback(
    (p: number, limit: number) =>
      adminApi.getOrders({ page: p, limit, ...filters }) as Promise<{
        data: OrderRow[];
        pagination: import('@half-dinar/shared').PaginationMeta;
      }>,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filters tracked via deps array below
    [statusFilter, paymentMethodFilter, paymentStatusFilter, dateFrom, dateTo, searchApplied],
  );

  const { items, setPage, pagination, loading, reload, error } = usePaginatedList<OrderRow>(
    fetchOrders,
    [statusFilter, paymentMethodFilter, paymentStatusFilter, dateFrom, dateTo, searchApplied, pageSize],
    pageSize,
  );

  const clearFilters = () => {
    setStatusFilter('');
    setPaymentMethodFilter('');
    setPaymentStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setSearch('');
    setSearchApplied('');
  };

  const applySearch = (e?: FormEvent) => {
    e?.preventDefault();
    setSearchApplied(search.trim());
  };

  const hasActiveFilters = Boolean(
    statusFilter ||
      paymentMethodFilter ||
      paymentStatusFilter ||
      dateFrom ||
      dateTo ||
      searchApplied,
  );

  const closeDetail = () => {
    setSelected(null);
    setNote('');
  };

  const openOrder = async (id: string) => {
    setDetailLoading(true);
    try {
      const r = await adminApi.getOrder(id);
      const order = r.data as OrderDetail;
      setSelected(order);
      setNewStatus(order.status);
      setNote('');
    } finally {
      setDetailLoading(false);
    }
  };

  const updateStatus = async () => {
    if (!selected) return;
    if (newStatus === selected.status) {
      await showToastSuccess('الحالة لم تتغير');
      return;
    }
    setSaving(true);
    try {
      await adminApi.updateOrderStatus(selected.id, newStatus, note);
      setNote('');
      const r = await adminApi.getOrder(selected.id);
      const order = r.data as OrderDetail;
      setSelected(order);
      setNewStatus(order.status);
      await reload();
      await showToastSuccess(`تم تحديث الحالة إلى «${STATUS_AR[order.status] ?? order.status}»`);
    } catch (err) {
      await showToastError(err instanceof Error ? err.message : 'فشل تحديث الحالة');
    } finally {
      setSaving(false);
    }
  };

  const deleteOrder = async (id: string, orderNumber: string) => {
    const ok = await confirmDelete(
      `حذف الطلب ${orderNumber}؟ سيُزال من القائمة والإحصائيات، ويُعاد المخزون ونقاط الولاء إن لزم.`,
      'حذف الطلب',
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await adminApi.deleteOrder(id);
      closeDetail();
      await reload();
      await showToastSuccess(`تم حذف الطلب ${orderNumber}`);
    } catch (err) {
      await showToastError(err instanceof Error ? err.message : 'فشل حذف الطلب');
    } finally {
      setDeleting(false);
    }
  };

  const allowedStatuses = useMemo(() => {
    if (!selected) return [...STATUSES];
    const next = NEXT_STATUSES[selected.status] ?? [];
    return [selected.status, ...next.filter((s) => s !== selected.status)];
  }, [selected]);

  const columns: Column<OrderRow>[] = [
    {
      key: 'num',
      header: 'الطلب',
      render: (o) => (
        <div>
          <p className="font-semibold text-slate-900">{o.orderNumber}</p>
          <p className="text-xs text-slate-500">
            {new Date(o.createdAt).toLocaleString('ar-JO', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'العميل',
      render: (o) => (
        <div>
          <p className="font-medium">
            {[o.customer?.firstName, o.customer?.lastName].filter(Boolean).join(' ') || '—'}
          </p>
          <p className="text-xs text-slate-500">{o.customer?.email ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'total',
      header: 'المبلغ',
      render: (o) => <span className="font-semibold tabular-nums">{formatMoney(o.total)} د.أ</span>,
    },
    {
      key: 'payment',
      header: 'الدفع',
      render: (o) => (
        <div className="space-y-1">
          <Badge variant={PAYMENT_STATUS_VARIANT[o.paymentStatus] ?? 'default'}>
            {paymentSummary(o.paymentMethod, o.paymentStatus)}
          </Badge>
          <p className="text-[11px] text-slate-500">{paymentMethodLabel(o.paymentMethod)}</p>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'العناصر',
      render: (o) => <span className="text-slate-600">{o.itemCount}</span>,
    },
    {
      key: 'status',
      header: 'حالة الطلب',
      render: (o) => (
        <Badge variant={STATUS_VARIANT[o.status] ?? 'default'}>{STATUS_AR[o.status] ?? o.status}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (o) => (
        <TableActions
          actions={[
            {
              label: 'تفاصيل',
              icon: 'mdi:eye-outline',
              variant: 'edit',
              onClick: () => openOrder(o.id),
            },
            {
              label: 'حذف',
              icon: 'mdi:trash-can-outline',
              variant: 'danger',
              onClick: () => void deleteOrder(o.id, o.orderNumber),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageHeader title="الطلبات" description="متابعة الدفع (COD / بطاقة) وتحديث حالة الطلبات" />

      <div className="admin-card mb-4 space-y-3 p-4">
        <form onSubmit={applySearch} className="flex flex-wrap items-end gap-3">
          <label className="min-w-[14rem] flex-1 text-xs font-semibold text-slate-600">
            بحث (رقم الطلب / إيميل / اسم / هاتف / مرجع MEPS)
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="مثال: AN2609 أو customer@email.com"
              className="input-field mt-1"
            />
          </label>
          <button type="submit" className="btn-primary text-sm">
            بحث
          </button>
        </form>

        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-semibold text-slate-600">
            من تاريخ
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input-field mt-1 w-40"
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            إلى تاريخ
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input-field mt-1 w-40"
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            حالة الطلب
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select-field mt-1 w-44"
            >
              <option value="">الكل</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_AR[s] ?? s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            طريقة الدفع
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="select-field mt-1 w-48"
            >
              <option value="">الكل</option>
              <option value="cod">عند الاستلام (COD)</option>
              <option value="meps">بطاقة Visa / Mastercard</option>
              <option value="stripe">Stripe</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            حالة الدفع
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="select-field mt-1 w-40"
            >
              <option value="">الكل</option>
              <option value="paid">مدفوع</option>
              <option value="pending">غير مدفوع</option>
              <option value="failed">فشل</option>
              <option value="refunded">مسترد</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            لكل صفحة
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="select-field mt-1 w-28"
            >
              {[10, 20, 30, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          {hasActiveFilters && (
            <button type="button" onClick={clearFilters} className="btn-secondary text-sm">
              مسح الفلاتر
            </button>
          )}
          {detailLoading && <span className="text-sm text-slate-500">جاري فتح التفاصيل...</span>}
        </div>

        <p className="text-xs text-slate-500">
          {loading
            ? 'جاري التحميل...'
            : `النتيجة: ${pagination.total} طلب · الصفحة ${pagination.page} من ${pagination.totalPages}`}
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        rowKey={(o) => o.id}
        pagination={pagination}
        onPageChange={setPage}
        onRowClick={(o) => openOrder(o.id)}
        emptyMessage="لا توجد طلبات مطابقة للفلاتر"
      />

      <Modal
        open={Boolean(selected)}
        title={selected ? `طلب ${selected.orderNumber}` : 'تفاصيل الطلب'}
        onClose={closeDetail}
        wide
      >
        {selected && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                {new Date(selected.createdAt).toLocaleString('ar-JO')}
              </p>

              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-sm">
                <h4 className="mb-3 font-semibold text-slate-800">تفاصيل الدفع</h4>
                <dl className="space-y-2.5">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">طريقة الدفع</dt>
                    <dd className="text-end font-semibold">{paymentMethodLabel(selected.paymentMethod)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">حالة الدفع</dt>
                    <dd>
                      <Badge variant={PAYMENT_STATUS_VARIANT[selected.paymentStatus] ?? 'default'}>
                        {PAYMENT_STATUS_AR[selected.paymentStatus] ?? selected.paymentStatus}
                      </Badge>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">الملخص</dt>
                    <dd className="text-end font-medium">
                      {paymentSummary(selected.paymentMethod, selected.paymentStatus)}
                    </dd>
                  </div>
                  {selected.paytabsTranRef && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">مرجع MEPS</dt>
                      <dd className="break-all text-end font-mono text-xs">{selected.paytabsTranRef}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">حالة الطلب</dt>
                    <dd>
                      <Badge variant={STATUS_VARIANT[selected.status] ?? 'default'}>
                        {STATUS_AR[selected.status] ?? selected.status}
                      </Badge>
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="mb-2 font-semibold text-slate-800">المنتجات</h4>
                <ul className="space-y-2 text-sm">
                  {selected.items.map((i) => (
                    <li key={i.id} className="flex justify-between border-b border-slate-50 pb-2">
                      <span>
                        {i.name}
                        <span className="text-slate-500"> × {i.quantity}</span>
                      </span>
                      <span className="tabular-nums text-slate-700">{formatMoney(i.total)} د.أ</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>المجموع الفرعي</span>
                    <span className="tabular-nums">{formatMoney(selected.subtotal)} د.أ</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>التوصيل</span>
                    <span className="tabular-nums">
                      {Number(selected.shippingAmount) === 0
                        ? 'مجاني'
                        : `${formatMoney(selected.shippingAmount)} د.أ`}
                    </span>
                  </div>
                  {Number(selected.discountAmount) > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>الخصم</span>
                      <span className="tabular-nums">-{formatMoney(selected.discountAmount)} د.أ</span>
                    </div>
                  )}
                  <p className="pt-1 text-xl font-bold text-primary-700 tabular-nums">
                    {formatMoney(selected.total)} د.أ
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {addressLines(selected.shippingAddress).length > 0 && (
                <div className="rounded-xl border border-slate-100 p-4 text-sm">
                  <h4 className="mb-2 font-semibold text-slate-800">عنوان التوصيل</h4>
                  <p className="leading-relaxed text-slate-600">
                    {addressLines(selected.shippingAddress).join(' · ')}
                  </p>
                </div>
              )}

              {selected.notes && (
                <div className="rounded-xl border border-slate-100 p-4 text-sm">
                  <h4 className="mb-1 font-semibold text-slate-800">ملاحظات العميل</h4>
                  <p className="text-slate-600">{selected.notes}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openAdminOrderInvoice(selected.id, 'html')}
                  className="btn-secondary text-xs"
                >
                  فاتورة HTML
                </button>
                <button
                  type="button"
                  onClick={() => openAdminOrderInvoice(selected.id, 'pdf')}
                  className="btn-primary text-xs"
                >
                  PDF
                </button>
              </div>

              <div className="rounded-xl border border-slate-100 p-4">
                <h4 className="font-medium text-slate-700">تحديث حالة الطلب</h4>
                <p className="mt-1 text-xs text-slate-500">
                  تظهر فقط الحالات المسموح الانتقال إليها من الحالة الحالية.
                </p>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="select-field mt-2"
                >
                  {allowedStatuses.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_AR[s] ?? s}
                      {s === selected.status ? ' (الحالية)' : ''}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="ملاحظة (اختياري)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="input-field mt-2"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void updateStatus()}
                    disabled={saving || deleting || allowedStatuses.length <= 1}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    {saving ? 'جاري الحفظ...' : 'حفظ الحالة'}
                  </button>
                  <button type="button" onClick={closeDetail} className="btn-secondary">
                    إغلاق
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => void deleteOrder(selected.id, selected.orderNumber)}
                  disabled={saving || deleting}
                  className="mt-3 w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  {deleting ? 'جاري الحذف...' : 'حذف الطلب من الإحصائيات'}
                </button>
                <p className="mt-1 text-[11px] text-slate-500">
                  الحذف يُخرج الطلب من لوحة الإحصائيات ويعيد المخزون ونقاط الولاء عند الحاجة.
                </p>
              </div>

              {selected.timeline?.length > 0 && (
                <div>
                  <h4 className="mb-2 font-semibold text-slate-800">سجل الحالة</h4>
                  <ol className="max-h-48 space-y-2 overflow-y-auto text-sm">
                    {selected.timeline.map((t) => (
                      <li key={t.id} className="rounded-lg bg-slate-50 px-3 py-2">
                        <p className="font-medium">{STATUS_AR[t.toStatus] ?? t.toStatus}</p>
                        {t.note && <p className="text-xs text-slate-500">{t.note}</p>}
                        <p className="text-[11px] text-slate-400">
                          {new Date(t.createdAt).toLocaleString('ar-JO')}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
