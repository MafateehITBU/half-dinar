import { useCallback, useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { Pagination } from '../components/ui/Pagination';
import { Badge } from '../components/ui/Badge';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { adminApi } from '../lib/api';

interface RefundRow {
  id: string;
  reason: string;
  status: string;
  adminNotes: string | null;
  user: { email: string; firstName: string };
  order?: { orderNumber: string; total: number };
  evidence: { imageUrl: string }[];
}

const STATUS_AR: Record<string, string> = {
  requested: 'جديد',
  under_review: 'قيد المراجعة',
  approved: 'موافق',
  rejected: 'مرفوض',
};

export function RefundsPage() {
  const [filter, setFilter] = useState('requested');

  const fetchRefunds = useCallback(
    (p: number, limit: number) =>
      adminApi.getRefunds(filter, p, limit) as Promise<{ data: RefundRow[]; pagination: import('@half-dinar/shared').PaginationMeta }>,
    [filter],
  );

  const { items, setPage, pagination, loading, reload } = usePaginatedList<RefundRow>(fetchRefunds, [filter]);

  return (
    <AdminLayout>
      <PageHeader title="طلبات الاسترداد" description="معالجة طلبات استرداد العملاء" />

      <div className="mb-4 flex flex-wrap gap-2">
        {['requested', 'under_review', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              filter === s ? 'bg-primary text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            {STATUS_AR[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-500">جاري التحميل...</p>
      ) : (
        <>
          <ul className="space-y-4">
            {items.map((r) => (
              <li key={r.id} className="admin-card p-5">
                <div className="flex flex-wrap justify-between gap-2 text-sm">
                  <span className="font-bold text-slate-900">
                    {r.order?.orderNumber} — {r.user.email}
                  </span>
                  <Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'}>
                    {STATUS_AR[r.status]}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600">{r.reason}</p>
                {r.evidence.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {r.evidence.map((e, i) => (
                      <a key={i} href={e.imageUrl} target="_blank" rel="noreferrer" className="text-xs text-primary-700 hover:underline">
                        دليل {i + 1}
                      </a>
                    ))}
                  </div>
                )}
                {['requested', 'under_review'].includes(r.status) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className="btn-primary text-xs" onClick={() => adminApi.moderateRefund(r.id, 'approved').then(reload)}>
                      موافقة
                    </button>
                    <button type="button" className="btn-secondary text-xs" onClick={() => adminApi.moderateRefund(r.id, 'under_review').then(reload)}>
                      مراجعة
                    </button>
                    <button type="button" className="btn-danger text-xs" onClick={() => adminApi.moderateRefund(r.id, 'rejected').then(reload)}>
                      رفض
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div className="admin-card mt-4">
            <Pagination pagination={pagination} onPageChange={setPage} />
          </div>
        </>
      )}
    </AdminLayout>
  );
}
