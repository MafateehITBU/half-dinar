import { useCallback } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, type Column } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { adminApi } from '../lib/api';

interface Sub {
  id: string;
  email: string;
  newsletter: boolean;
  offers: boolean;
  subscribedAt: string;
}

export function NewsletterPage() {
  const fetchSubs = useCallback(
    (p: number, limit: number) =>
      adminApi.getNewsletterSubscribers(p, limit) as Promise<{ data: Sub[]; pagination: import('@half-dinar/shared').PaginationMeta }>,
    [],
  );
  const { items, setPage, pagination, loading } = usePaginatedList<Sub>(fetchSubs);

  const columns: Column<Sub>[] = [
    { key: 'email', header: 'البريد', render: (s) => s.email },
    {
      key: 'newsletter',
      header: 'نشرة',
      render: (s) => (s.newsletter ? <Badge variant="success">✓</Badge> : <span className="text-slate-400">—</span>),
    },
    {
      key: 'offers',
      header: 'عروض',
      render: (s) => (s.offers ? <Badge variant="success">✓</Badge> : <span className="text-slate-400">—</span>),
    },
    {
      key: 'date',
      header: 'تاريخ الاشتراك',
      render: (s) => new Date(s.subscribedAt).toLocaleDateString('ar-JO'),
    },
  ];

  return (
    <AdminLayout>
      <PageHeader title="مشتركو النشرة" description="قائمة المشتركين مع ترقيم الصفحات" />
      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        rowKey={(s) => s.id}
        pagination={pagination}
        onPageChange={setPage}
      />
    </AdminLayout>
  );
}
