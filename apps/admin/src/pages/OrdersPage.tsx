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

type OrderRow = OrderSummary & {
  customer?: { email: string; firstName: string; lastName: string };
};

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
    { key: 'customer', header: 'العميل', render: (o) => o.customer?.email ?? '—' },
    { key: 'total', header: 'المبلغ', render: (o) => `${o.total.toFixed(2)} د.أ` },
    {
      key: 'status',
      header: 'الحالة',
      render: (o) => <Badge variant={STATUS_VARIANT[o.status] ?? 'default'}>{o.status}</Badge>,
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
      <PageHeader title="الطلبات" description="متابعة وتحديث حالة الطلبات" />

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="select-field mb-4 w-48"
      >
        <option value="">جميع الحالات</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
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
          <div className="admin-card p-6 lg:sticky lg:top-24 lg:self-start">
            <h3 className="text-lg font-bold">طلب {selected.orderNumber}</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {selected.items.map((i) => (
                <li key={i.id} className="flex justify-between border-b border-slate-50 pb-2">
                  <span>{i.name}</span>
                  <span className="text-slate-500">× {i.quantity}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xl font-bold text-primary-700">{selected.total.toFixed(2)} د.أ</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => openAdminOrderInvoice(selected.id, 'html')} className="btn-secondary text-xs">
                فاتورة HTML
              </button>
              <button type="button" onClick={() => openAdminOrderInvoice(selected.id, 'pdf')} className="btn-primary text-xs">
                PDF
              </button>
            </div>

            <h4 className="mt-6 font-medium text-slate-700">تحديث الحالة</h4>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="select-field mt-2"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
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
        )}
      </div>
    </AdminLayout>
  );
}
