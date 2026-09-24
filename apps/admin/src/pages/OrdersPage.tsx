import { useCallback, useState } from 'react';
import type { OrderDetail, OrderSummary } from '@half-dinar/shared';
import { AdminLayout } from '../components/AdminLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, type Column } from '../components/ui/DataTable';
import { TableActions } from '../components/ui/TableActions';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { adminApi, openAdminOrderInvoice } from '../lib/api';

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
  const [selected, setSelected] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchOrders = useCallback(
    (p: number, limit: number) =>
      adminApi.getOrders({ page: p, limit, status: statusFilter || undefined }) as Promise<{
        data: OrderRow[];
        pagination: import('@half-dinar/shared').PaginationMeta;
      }>,
    [statusFilter],
  );

  const { items, setPage, pagination, loading, reload } = usePaginatedList<OrderRow>(
    fetchOrders,
    [statusFilter],
    30,
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
    setSaving(true);
    try {
      await adminApi.updateOrderStatus(selected.id, newStatus, note);
      setNote('');
      reload();
      const r = await adminApi.getOrder(selected.id);
      const order = r.data as OrderDetail;
      setSelected(order);
      setNewStatus(order.status);
    } finally {
      setSaving(false);
    }
  };

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
      render: (o) => <span className="font-semibold tabular-nums">{o.total.toFixed(2)} د.أ</span>,
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
          ]}
        />
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageHeader title="الطلبات" description="متابعة الدفع (COD / بطاقة) وتحديث حالة الطلبات" />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="select-field w-52"
        >
          <option value="">جميع الحالات</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_AR[s] ?? s}
            </option>
          ))}
        </select>
        {detailLoading && <span className="text-sm text-slate-500">جاري فتح التفاصيل...</span>}
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        rowKey={(o) => o.id}
        pagination={pagination}
        onPageChange={setPage}
        onRowClick={(o) => openOrder(o.id)}
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
                      <span className="tabular-nums text-slate-700">{i.total.toFixed(2)} د.أ</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>المجموع الفرعي</span>
                    <span className="tabular-nums">{selected.subtotal.toFixed(2)} د.أ</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>التوصيل</span>
                    <span className="tabular-nums">
                      {selected.shippingAmount === 0 ? 'مجاني' : `${selected.shippingAmount.toFixed(2)} د.أ`}
                    </span>
                  </div>
                  {selected.discountAmount > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>الخصم</span>
                      <span className="tabular-nums">-{selected.discountAmount.toFixed(2)} د.أ</span>
                    </div>
                  )}
                  <p className="pt-1 text-xl font-bold text-primary-700 tabular-nums">
                    {selected.total.toFixed(2)} د.أ
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
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="select-field mt-2"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_AR[s] ?? s}
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
                    onClick={updateStatus}
                    disabled={saving}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    {saving ? 'جاري الحفظ...' : 'حفظ الحالة'}
                  </button>
                  <button type="button" onClick={closeDetail} className="btn-secondary">
                    إغلاق
                  </button>
                </div>
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
