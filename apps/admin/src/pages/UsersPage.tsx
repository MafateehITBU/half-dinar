import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import type { AdminCreateUserInput, AdminUpdateUserInput, AdminUserSummary } from '@half-dinar/shared';
import { ASSIGNABLE_ROLE_SLUGS, ROLES } from '@half-dinar/shared';

type AssignableRole = (typeof ASSIGNABLE_ROLE_SLUGS)[number];
import { AdminLayout } from '../components/AdminLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, type BulkAction, type Column } from '../components/ui/DataTable';
import { TableActions } from '../components/ui/TableActions';
import { useTableSelection } from '../hooks/useTableSelection';
import { reportBulkResult } from '../lib/bulk';
import { confirmAction, showSuccess } from '../lib/confirm';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { adminApi } from '../lib/api';

const ROLE_LABELS: Record<string, string> = {
  [ROLES.CUSTOMER]: 'عميل',
  [ROLES.SUPER_ADMIN]: 'مدير عام',
  [ROLES.ADMIN]: 'مدير',
  [ROLES.MANAGE_PRODUCT]: 'منتجات',
  [ROLES.SALES]: 'مبيعات',
  [ROLES.INSIGHTS]: 'تحليلات',
};

const STAFF_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.MANAGE_PRODUCT,
  ROLES.SALES,
  ROLES.INSIGHTS,
];

type FormState = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  locale: 'ar' | 'en';
  isActive: boolean;
  emailVerified: boolean;
  roles: AssignableRole[];
};

const emptyForm = (): FormState => ({
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  locale: 'ar',
  isActive: true,
  emailVerified: false,
  roles: [ROLES.CUSTOMER],
});

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'staff'>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>('all');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<AdminUserSummary | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<{ slug: string; nameAr: string }[]>([]);

  const fetchUsers = useCallback(
    (page: number, limit: number) =>
      adminApi.getUsers({ page, limit, search: search || undefined, role: roleFilter, active: activeFilter }),
    [search, roleFilter, activeFilter],
  );

  const { items, setPage, pagination, loading, error, reload } = usePaginatedList<AdminUserSummary>(
    fetchUsers,
    [search, roleFilter, activeFilter],
  );
  const { selectedIds, setSelectedIds, clearSelection } = useTableSelection(
    items,
    pagination?.page,
    search,
    roleFilter,
    activeFilter,
  );

  useEffect(() => {
    adminApi.getRoles().then((r) => setAvailableRoles(r.data));
  }, []);

  const openCreate = () => {
    setForm(emptyForm());
    setFormError('');
    setEditing(null);
    setModal('create');
  };

  const openEdit = (user: AdminUserSummary) => {
    setEditing(user);
    setForm({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? '',
      locale: user.locale,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      roles: user.roles.filter((r): r is AssignableRole =>
        (ASSIGNABLE_ROLE_SLUGS as readonly string[]).includes(r),
      ),
    });
    setFormError('');
    setModal('edit');
  };

  const toggleRole = (slug: AssignableRole) => {
    setForm((f) => {
      const has = f.roles.includes(slug);
      if (has) return { ...f, roles: f.roles.filter((r) => r !== slug) };
      return { ...f, roles: [...f.roles, slug] };
    });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (modal === 'create') {
        const payload: AdminCreateUserInput = {
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || undefined,
          locale: form.locale,
          isActive: form.isActive,
          emailVerified: form.emailVerified,
          roles: form.roles.length ? form.roles : [ROLES.CUSTOMER],
        };
        await adminApi.createUser(payload);
      } else if (editing) {
        const payload: AdminUpdateUserInput = {
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || null,
          locale: form.locale,
          isActive: form.isActive,
          emailVerified: form.emailVerified,
          roles: form.roles,
        };
        if (form.password) payload.password = form.password;
        await adminApi.updateUser(editing.id, payload);
      }
      setModal(null);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<AdminUserSummary>[] = [
    {
      key: 'name',
      header: 'المستخدم',
      render: (u) => (
        <div>
          <p className="font-medium text-slate-900">
            {u.firstName} {u.lastName}
          </p>
          <p className="text-xs text-slate-500">{u.email}</p>
        </div>
      ),
    },
    {
      key: 'roles',
      header: 'الأدوار',
      render: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.roles.map((r) => (
            <Badge key={r} variant={r === ROLES.CUSTOMER ? 'default' : 'primary'}>
              {ROLE_LABELS[r] ?? r}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'orders',
      header: 'الطلبات',
      render: (u) => <span>{u.orderCount}</span>,
    },
    {
      key: 'status',
      header: 'الحالة',
      render: (u) => (
        <div className="flex flex-wrap gap-1">
          <Badge variant={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'نشط' : 'معطّل'}</Badge>
          <Badge variant={u.emailVerified ? 'success' : 'warning'}>
            {u.emailVerified ? 'بريد مفعّل' : 'بريد غير مفعّل'}
          </Badge>
        </div>
      ),
    },
    {
      key: 'created',
      header: 'التسجيل',
      render: (u) => (
        <span className="text-slate-500">{new Date(u.createdAt).toLocaleDateString('ar-JO')}</span>
      ),
    },
    {
      key: 'actions',
      header: 'إجراءات',
      render: (u) => (
        <TableActions
          actions={[
            {
              label: 'تعديل',
              icon: 'mdi:pencil-outline',
              variant: 'edit',
              onClick: () => openEdit(u),
            },
            ...(!u.emailVerified
              ? [
                  {
                    label: 'تفعيل',
                    icon: 'mdi:email-fast-outline',
                    variant: 'warning' as const,
                    onClick: () =>
                      adminApi.resendUserVerification(u.id).then(() => showSuccess('تم إرسال رابط التفعيل')),
                  },
                ]
              : []),
            ...(u.isActive && !u.roles.includes(ROLES.SUPER_ADMIN)
              ? [
                  {
                    label: 'تعطيل',
                    icon: 'mdi:account-off-outline',
                    variant: 'danger' as const,
                    onClick: async () => {
                      if (await confirmAction('تعطيل المستخدم', 'تعطيل هذا المستخدم؟', { variant: 'danger', confirmText: 'تعطيل' })) {
                        await adminApi.deactivateUser(u.id);
                        reload();
                      }
                    },
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ];

  const userBulkActions: BulkAction[] = [
    {
      id: 'deactivate',
      label: 'تعطيل المحدّد',
      icon: 'mdi:account-off-outline',
      variant: 'danger',
      confirm: 'تعطيل {count} مستخدم؟',
      onAction: async (ids) => {
        const { data } = await adminApi.bulkDeactivateUsers(ids);
        reportBulkResult(data, 'تعطيل المستخدمين');
        clearSelection();
        reload();
      },
    },
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="المستخدمون"
        description="إدارة حسابات العملاء وفريق العمل — بحث، تعديل، وتفعيل البريد"
        actions={
          <button type="button" onClick={openCreate} className="btn-primary">
            <Icon icon="mdi:account-plus-outline" />
            مستخدم جديد
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <form
          className="flex flex-1 min-w-[200px] gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput.trim());
          }}
        >
          <input
            className="input-field max-w-md"
            placeholder="بحث بالبريد أو الاسم..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="btn-secondary">
            بحث
          </button>
        </form>
        <select
          className="select-field w-40"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
        >
          <option value="all">كل الأدوار</option>
          <option value="customer">عملاء</option>
          <option value="staff">فريق العمل</option>
        </select>
        <select
          className="select-field w-36"
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value as typeof activeFilter)}
        >
          <option value="all">الكل</option>
          <option value="true">نشط</option>
          <option value="false">معطّل</option>
        </select>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        rowKey={(u) => u.id}
        pagination={pagination}
        onPageChange={setPage}
        onRowClick={openEdit}
        emptyMessage="لا يوجد مستخدمون"
        selectable
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        bulkActions={userBulkActions}
        isRowSelectable={(u) => u.isActive && !u.roles.includes(ROLES.SUPER_ADMIN)}
      />

      <Modal
        open={modal !== null}
        title={modal === 'create' ? 'إضافة مستخدم' : 'تعديل مستخدم'}
        onClose={() => setModal(null)}
        wide
      >
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-slate-600">البريد</span>
            <input
              required
              type="email"
              className="input-field"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-600">الاسم الأول</span>
            <input
              required
              className="input-field"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-600">اسم العائلة</span>
            <input
              required
              className="input-field"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-600">الهاتف</span>
            <input
              className="input-field"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-600">
              كلمة المرور {modal === 'edit' && '(اتركها فارغة بدون تغيير)'}
            </span>
            <input
              type="password"
              className="input-field"
              required={modal === 'create'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-600">اللغة</span>
            <select
              className="select-field"
              value={form.locale}
              onChange={(e) => setForm({ ...form, locale: e.target.value as 'ar' | 'en' })}
            >
              <option value="ar">عربي</option>
              <option value="en">English</option>
            </select>
          </label>
          <div className="sm:col-span-2 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              حساب نشط
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.emailVerified}
                onChange={(e) => setForm({ ...form, emailVerified: e.target.checked })}
              />
              البريد مفعّل
            </label>
          </div>
          <fieldset className="sm:col-span-2">
            <legend className="mb-2 text-xs font-medium text-slate-600">الأدوار</legend>
            <div className="flex flex-wrap gap-2">
              {(availableRoles.length ? availableRoles : Object.entries(ROLE_LABELS).map(([slug, nameAr]) => ({ slug, nameAr }))).map(
                (r) => (
                  <label
                    key={r.slug}
                    className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm ${
                      form.roles.includes(r.slug as AssignableRole)
                        ? 'border-primary bg-primary-50 text-primary-800'
                        : 'border-slate-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={form.roles.includes(r.slug as AssignableRole)}
                      onChange={() => toggleRole(r.slug as AssignableRole)}
                    />
                    {r.nameAr ?? ROLE_LABELS[r.slug]}
                  </label>
                ),
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              العميل: {ROLE_LABELS[ROLES.CUSTOMER]} — فريق العمل: {STAFF_ROLES.map((s) => ROLE_LABELS[s]).join('، ')}
            </p>
          </fieldset>
          {formError && <p className="text-sm text-red-600 sm:col-span-2">{formError}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button type="button" onClick={() => setModal(null)} className="btn-secondary">
              إلغاء
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
