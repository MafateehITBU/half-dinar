import { useCallback, useState } from 'react';
import type { OrderDetail, OrderSummary } from '@half-dinar/shared';
import { AdminLayout } from '../components/AdminLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, type Column } from '../components/ui/DataTable';
import { TableActions } from '../components/ui/TableActions';
import { Badge } from '../components/ui/Badge';
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
  const parts = [
    addr.label,
    addr.governorate,
    addr.city,
    addr.street,
    addr.building,
    addr.phone,
  ]
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean);
  return parts;
}

export function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<OrderDetail | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');

  const fetchOrders = useCallback(
    (p: number, limit: number) =>
      adminApi.getOrders({ page: p, limit, status: statusFilter || undefined }) as Promise<{
        data: OrderRow[];
        pagination: import('@half-dinar/shared').PaginationMeta;
      }>,
    [statusFilter],
  );

  const { items, setPage, pagination, loading, reload } = usePaginatedList<OrderRow>(fetchOrders, [
    statusFilter,
  ]);

  const openOrder = async (id: string) => {
    const r = await adminApi.getOrder(id);
    setSelected(r.data as OrderDetail);
    setNewStatus((r.data as OrderDetail).status);
  };

  const updateStatus = async () => {
    if (!selected) return;
    await adminApi.updateOrderStatus(selected.id, newStatus, note);
    setNote('');
    reload();
    openOrder(selected.id);
  };

  const columns: Column<OrderRow>[] = [
    { key: 'num', header: 'الطلب', render: (o) => <span className="font-medium">{o.orderNumber}</span> },
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
    { key: 'total', header: 'المبلغ', render: (o) => `${o.total.toFixed(2)} د.أ` },
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
      key: 'status',
      header: 'حالة الطلب',
      render: (o) => (
        <Badge variant={STATUS_VARIANT[o.status] ?? 'default'}>{STATUS_AR[o.status] ?? o.status}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'إجراءات',
      render: (o) => (
        <TableActions
          actions={[
            {
              label: 'عرض',
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

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="select-field mb-4 w-48"
      >
        <option value="">جميع الحالات</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_AR[s] ?? s}
          </option>
        ))}
      </select>

      <div className="grid gap-6 lg:grid-cols-2">
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          rowKey={(o) => o.id}
          pagination={pagination}
          onPageChange={setPage}
          onRowClick={(o) => openOrder(o.id)}
        />

        {selected && (
          <div className="admin-card space-y-4 p-6 lg:sticky lg:top-24 lg:self-start">
            <div>
              <h3 className="text-lg font-bold">طلب {selected.orderNumber}</h3>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(selected.createdAt).toLocaleString('ar-JO')}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-sm">
              <h4 className="mb-2 font-semibold text-slate-800">تفاصيل الدفع</h4>
              <dl className="space-y-2">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">طريقة الدفع</dt>
                  <dd className="font-semibold text-end">{paymentMethodLabel(selected.paymentMethod)}</dd>
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
                  <dd className="font-medium text-end">
                    {paymentSummary(selected.paymentMethod, selected.paymentStatus)}
                  </dd>
                </div>
                {selected.paytabsTranRef && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">مرجع MEPS</dt>
                    <dd className="font-mono text-xs text-end break-all">{selected.paytabsTranRef}</dd>
                  </div>
                )}
              </dl>
            </div>

            <ul className="space-y-2 text-sm">
              {selected.items.map((i) => (
                <li key={i.id} className="flex justify-between border-b border-slate-50 pb-2">
                  <span>
                    {i.name}
                    <span className="text-slate-500"> × {i.quantity}</span>
                  </span>
                  <span className="text-slate-700">{i.total.toFixed(2)} د.أ</span>
                </li>
              ))}
            </ul>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>المجموع الفرعي</span>
                <span>{selected.subtotal.toFixed(2)} د.أ</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>التوصيل</span>
                <span>{selected.shippingAmount.toFixed(2)} د.أ</span>
              </div>
              {selected.discountAmount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>الخصم</span>
                  <span>-{selected.discountAmount.toFixed(2)} د.أ</span>
                </div>
              )}
              <p className="pt-1 text-xl font-bold text-primary-700">{selected.total.toFixed(2)} د.أ</p>
            </div>

            {addressLines(selected.shippingAddress).length > 0 && (
              <div className="rounded-xl border border-slate-100 p-4 text-sm">
                <h4 className="mb-2 font-semibold text-slate-800">عنوان التوصيل</h4>
                <p className="leading-relaxed text-slate-600">
                  {addressLines(selected.shippingAddress).join(' · ')}
                </p>
              </div>
            )}

            {selected.notes && (
              <p className="text-sm text-slate-600">
                <span className="font-semibold">ملاحظات العميل: </span>
                {selected.notes}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => openAdminOrderInvoice(selected.id, 'html')} className="btn-secondary text-xs">
                فاتورة HTML
              </button>
              <button type="button" onClick={() => openAdminOrderInvoice(selected.id, 'pdf')} className="btn-primary text-xs">
                PDF
              </button>
            </div>

            <div>
              <h4 className="font-medium text-slate-700">تحديث حالة الطلب</h4>
              <p className="mt-1 text-xs text-slate-500">
                حالة الطلب الحالية:{' '}
                <Badge variant={STATUS_VARIANT[selected.status] ?? 'default'}>
                  {STATUS_AR[selected.status] ?? selected.status}
                </Badge>
              </p>
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
              <button type="button" onClick={updateStatus} className="btn-primary mt-3 w-full">
                حفظ الحالة
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
