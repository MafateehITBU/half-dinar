import { useCallback, useState } from 'react';
import { Icon } from '@iconify/react';
import { AdminLayout } from '../components/AdminLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, type BulkAction, type Column } from '../components/ui/DataTable';
import { TableActions } from '../components/ui/TableActions';
import { useTableSelection } from '../hooks/useTableSelection';
import { Badge } from '../components/ui/Badge';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { adminApi } from '../lib/api';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: 'new' | 'read' | 'archived';
  createdAt: string;
}

const STATUS_FILTERS = [
  { value: 'new', label: 'جديدة' },
  { value: 'read', label: 'مقروءة' },
  { value: 'archived', label: 'مؤرشفة' },
  { value: 'all', label: 'الكل' },
] as const;

const STATUS_BADGE: Record<string, 'warning' | 'success' | 'default'> = {
  new: 'warning',
  read: 'success',
  archived: 'default',
};

const STATUS_AR: Record<string, string> = {
  new: 'جديدة',
  read: 'مقروءة',
  archived: 'مؤرشفة',
};

export function ContactMessagesPage() {
  const [filter, setFilter] = useState<string>('new');
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchMessages = useCallback(
    (p: number, limit: number) =>
      adminApi.getContactMessages(p, limit, filter) as Promise<{
        data: ContactMessage[];
        pagination: import('@half-dinar/shared').PaginationMeta;
      }>,
    [filter],
  );

  const { items, setPage, pagination, loading, reload } = usePaginatedList<ContactMessage>(fetchMessages, [filter]);
  const { selectedIds, setSelectedIds, clearSelection } = useTableSelection(items, pagination?.page, filter);

  const updateStatus = async (id: string, status: 'new' | 'read' | 'archived') => {
    setUpdating(true);
    try {
      await adminApi.updateContactMessage(id, status);
      await reload();
      if (selected?.id === id) {
        const res = await adminApi.getContactMessage(id);
        setSelected(res.data as ContactMessage);
      }
    } finally {
      setUpdating(false);
    }
  };

  const openRow = async (row: ContactMessage) => {
    setSelected(row);
    if (row.status === 'new') {
      await updateStatus(row.id, 'read');
    }
  };

  const columns: Column<ContactMessage>[] = [
    {
      key: 'status',
      header: 'الحالة',
      render: (m) => <Badge variant={STATUS_BADGE[m.status] ?? 'default'}>{STATUS_AR[m.status]}</Badge>,
    },
    { key: 'name', header: 'الاسم', render: (m) => <span className="font-medium">{m.name}</span> },
    { key: 'email', header: 'البريد', render: (m) => <span dir="ltr">{m.email}</span> },
    {
      key: 'subject',
      header: 'الموضوع',
      render: (m) => m.subject ?? <span className="text-slate-400">—</span>,
    },
    {
      key: 'date',
      header: 'التاريخ',
      render: (m) => new Date(m.createdAt).toLocaleString('ar-JO'),
    },
    {
      key: 'actions',
      header: 'إجراءات',
      render: (m) => (
        <TableActions
          actions={[
            ...(m.status !== 'read'
              ? [
                  {
                    label: 'مقروءة',
                    icon: 'mdi:email-open-outline',
                    variant: 'edit' as const,
                    onClick: () => updateStatus(m.id, 'read'),
                  },
                ]
              : []),
            ...(m.status !== 'archived'
              ? [
                  {
                    label: 'أرشفة',
                    icon: 'mdi:archive-outline',
                    variant: 'default' as const,
                    onClick: () => updateStatus(m.id, 'archived'),
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ];

  const contactBulkActions: BulkAction[] = [
    {
      id: 'read',
      label: 'تعليم كمقروءة',
      icon: 'mdi:email-open-outline',
      variant: 'primary',
      onAction: async (ids) => {
        await adminApi.bulkUpdateContactStatus(ids, 'read');
        clearSelection();
        reload();
      },
    },
    {
      id: 'archive',
      label: 'أرشفة',
      icon: 'mdi:archive-outline',
      variant: 'secondary',
      onAction: async (ids) => {
        await adminApi.bulkUpdateContactStatus(ids, 'archived');
        clearSelection();
        reload();
      },
    },
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="رسائل التواصل"
        description="رسائل نموذج اتصل بنا من المتجر"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => {
              setFilter(s.value);
              setSelected(null);
            }}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              filter === s.value
                ? 'bg-primary text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          rowKey={(m) => m.id}
          pagination={pagination}
          onPageChange={setPage}
          onRowClick={openRow}
          emptyMessage="لا توجد رسائل"
          selectable
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          bulkActions={contactBulkActions}
        />

        <div className="admin-card sticky top-24 h-fit p-5">
          {!selected ? (
            <p className="text-center text-sm text-slate-500 py-8">اختر رسالة لعرض التفاصيل</p>
          ) : (
            <>
              <div className="mb-4 flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900">{selected.name}</h3>
                  <p className="text-sm text-slate-500" dir="ltr">
                    {selected.email}
                  </p>
                  {selected.phone && (
                    <p className="text-sm text-slate-600" dir="ltr">
                      {selected.phone}
                    </p>
                  )}
                </div>
                <Badge variant={STATUS_BADGE[selected.status] ?? 'default'}>
                  {STATUS_AR[selected.status]}
                </Badge>
              </div>
              {selected.subject && (
                <p className="mb-2 text-sm">
                  <span className="font-semibold text-slate-700">الموضوع: </span>
                  {selected.subject}
                </p>
              )}
              <p className="mb-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
                {selected.message}
              </p>
              <p className="mb-4 text-xs text-slate-400">
                {new Date(selected.createdAt).toLocaleString('ar-JO')}
              </p>
              <div className="flex flex-wrap gap-2">
                {selected.status !== 'read' && (
                  <button
                    type="button"
                    disabled={updating}
                    className="btn-secondary text-xs"
                    onClick={() => updateStatus(selected.id, 'read')}
                  >
                    <Icon icon="mdi:email-open-outline" />
                    مقروءة
                  </button>
                )}
                {selected.status !== 'archived' && (
                  <button
                    type="button"
                    disabled={updating}
                    className="btn-secondary text-xs"
                    onClick={() => updateStatus(selected.id, 'archived')}
                  >
                    <Icon icon="mdi:archive-outline" />
                    أرشفة
                  </button>
                )}
                {selected.status !== 'new' && (
                  <button
                    type="button"
                    disabled={updating}
                    className="btn-ghost text-xs"
                    onClick={() => updateStatus(selected.id, 'new')}
                  >
                    إعادة كـ جديدة
                  </button>
                )}
                {selected.email && (
                  <a
                    href={`mailto:${selected.email}?subject=رد: ${encodeURIComponent(selected.subject ?? 'رسالتك')}`}
                    className="btn-primary text-xs"
                  >
                    <Icon icon="mdi:reply" />
                    رد بالبريد
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
