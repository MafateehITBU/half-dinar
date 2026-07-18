import { useCallback, useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, type BulkAction, type Column } from '../components/ui/DataTable';
import { TableActions } from '../components/ui/TableActions';
import { useTableSelection } from '../hooks/useTableSelection';
import { reportBulkResult } from '../lib/bulk';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { adminApi } from '../lib/api';

interface ReviewRow {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: string;
  userName: string;
  product: { nameAr: string };
}

const FILTER_LABELS: Record<string, string> = {
  pending: 'قيد المراجعة',
  approved: 'موافق عليها',
  rejected: 'مرفوضة',
};

export function ReviewsPage() {
  const [filter, setFilter] = useState('pending');

  const fetchReviews = useCallback(
    (p: number, limit: number) =>
      adminApi.getReviews(filter, p, limit) as Promise<{ data: ReviewRow[]; pagination: import('@half-dinar/shared').PaginationMeta }>,
    [filter],
  );

  const { items, setPage, pagination, loading, reload } = usePaginatedList<ReviewRow>(fetchReviews, [filter]);
  const { selectedIds, setSelectedIds, clearSelection } = useTableSelection(items, pagination?.page, filter);

  const columns: Column<ReviewRow>[] = [
    {
      key: 'product',
      header: 'المنتج',
      render: (r) => (
        <div>
          <p className="font-medium text-slate-900">{r.product.nameAr}</p>
          <p className="text-xs text-amber-600">{'★'.repeat(r.rating)}</p>
        </div>
      ),
    },
    { key: 'user', header: 'المستخدم', render: (r) => r.userName },
    {
      key: 'content',
      header: 'التعليق',
      render: (r) => (
        <div className="max-w-md">
          {r.title && <p className="font-medium">{r.title}</p>}
          {r.body && <p className="text-slate-600 line-clamp-2">{r.body}</p>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'الحالة',
      render: (r) => FILTER_LABELS[r.status] ?? r.status,
    },
    {
      key: 'actions',
      header: 'إجراءات',
      render: (r) => (
        <TableActions
          actions={
            r.status === 'pending'
              ? [
                  {
                    label: 'موافقة',
                    icon: 'mdi:check-circle-outline',
                    variant: 'edit',
                    onClick: () => adminApi.moderateReview(r.id, 'approved').then(reload),
                  },
                  {
                    label: 'رفض',
                    icon: 'mdi:close-circle-outline',
                    variant: 'danger',
                    onClick: () => adminApi.moderateReview(r.id, 'rejected').then(reload),
                  },
                ]
              : []
          }
        />
      ),
    },
  ];

  const reviewBulkActions: BulkAction[] =
    filter === 'pending'
      ? [
          {
            id: 'approve',
            label: 'موافقة',
            icon: 'mdi:check-circle-outline',
            variant: 'primary',
            onAction: async (ids) => {
              const { data } = await adminApi.bulkModerateReviews(ids, 'approved');
              reportBulkResult(data, 'الموافقة على التقييمات');
              clearSelection();
              reload();
            },
          },
          {
            id: 'reject',
            label: 'رفض',
            icon: 'mdi:close-circle-outline',
            variant: 'danger',
            confirm: 'رفض {count} تقييم؟',
            onAction: async (ids) => {
              const { data } = await adminApi.bulkModerateReviews(ids, 'rejected');
              reportBulkResult(data, 'رفض التقييمات');
              clearSelection();
              reload();
            },
          },
        ]
      : [];

  return (
    <AdminLayout>
      <PageHeader title="التقييمات" description="مراجعة تقييمات المنتجات — موافقة أو رفض جماعي" />

      <div className="mb-4 flex gap-2">
        {['pending', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              filter === s ? 'bg-primary text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {FILTER_LABELS[s] ?? s}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        rowKey={(r) => r.id}
        pagination={pagination}
        onPageChange={setPage}
        emptyMessage="لا توجد تقييمات"
        selectable={filter === 'pending'}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        bulkActions={reviewBulkActions}
      />
    </AdminLayout>
  );
}
