import { FormEvent, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { AdminLayout } from '../components/AdminLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, type BulkAction, type Column } from '../components/ui/DataTable';
import { TableActions } from '../components/ui/TableActions';
import { useTableSelection } from '../hooks/useTableSelection';
import { reportBulkResult } from '../lib/bulk';
import { confirmDelete } from '../lib/confirm';
import { Modal } from '../components/ui/Modal';
import { IconPicker } from '../components/IconPicker';
import { ProductImageUpload } from '../components/ProductImageUpload';
import { adminApi } from '../lib/api';

interface Category {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  parentId: string | null;
  isActive: boolean;
  imageUrl?: string | null;
  icon?: string | null;
  children?: Category[];
}

function flatten(nodes: Category[], depth = 0, excludeId?: string): (Category & { depth: number })[] {
  return nodes.flatMap((n) => {
    if (n.id === excludeId) return [];
    return [
      { ...n, depth },
      ...flatten(n.children ?? [], depth + 1, excludeId),
    ];
  });
}

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [parentId, setParentId] = useState('');
  const [icon, setIcon] = useState('');
  const [imageFile, setImageFile] = useState<File[]>([]);
  const [cloudinaryEnabled, setCloudinaryEnabled] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editNameAr, setEditNameAr] = useState('');
  const [editNameEn, setEditNameEn] = useState('');
  const [editParentId, setEditParentId] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editIcon, setEditIcon] = useState('');
  const [editImage, setEditImage] = useState<File[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const load = () => adminApi.getCategories().then((r) => setCategories(r.data as Category[]));

  useEffect(() => {
    load();
    adminApi.getProductMediaConfig().then((r) => setCloudinaryEnabled(r.data.cloudinary));
  }, []);

  const flat = flatten(categories);
  const flatForEdit = editId ? flatten(categories, 0, editId) : flat;
  const { selectedIds, setSelectedIds, clearSelection } = useTableSelection(flat);

  const openEdit = (c: Category) => {
    setEditId(c.id);
    setEditNameAr(c.nameAr);
    setEditNameEn(c.nameEn);
    setEditParentId(c.parentId ?? '');
    setEditActive(c.isActive);
    setEditIcon(c.icon ?? '');
    setEditImage([]);
    setEditError('');
  };

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        nameAr,
        nameEn,
        parentId: parentId || undefined,
        icon: icon || undefined,
      };
      if (imageFile[0] && cloudinaryEnabled) {
        await adminApi.createCategoryWithImage(payload, imageFile[0]);
      } else {
        if (imageFile[0] && !cloudinaryEnabled) {
          setError('فعّل Cloudinary لرفع صورة التصنيف');
          return;
        }
        await adminApi.createCategory({
          ...payload,
          parentId: parentId || null,
          icon: icon || null,
          isActive: true,
        });
      }
      setNameAr('');
      setNameEn('');
      setParentId('');
      setIcon('');
      setImageFile([]);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الإضافة');
    } finally {
      setSaving(false);
    }
  };

  const onEditSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setEditError('');
    setEditSaving(true);
    try {
      const payload = {
        nameAr: editNameAr.trim(),
        nameEn: editNameEn.trim(),
        parentId: editParentId || null,
        isActive: editActive,
        icon: editIcon || null,
      };
      if (editImage[0] && cloudinaryEnabled) {
        await adminApi.updateCategoryWithImage(editId, payload, editImage[0]);
      } else {
        await adminApi.updateCategory(editId, payload);
      }
      setEditId(null);
      load();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'فشل التحديث');
    } finally {
      setEditSaving(false);
    }
  };

  const columns: Column<Category & { depth: number }>[] = [
    {
      key: 'name',
      header: 'التصنيف',
      render: (c) => (
        <div className="flex items-center gap-3" style={{ paddingRight: c.depth * 12 }}>
          {c.imageUrl ? (
            <img src={c.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
              <Icon icon={c.icon || 'mdi:folder-outline'} className="text-xl" />
            </span>
          )}
          <span className="font-medium">{c.nameAr}</span>
        </div>
      ),
    },
    { key: 'slug', header: 'Slug', render: (c) => <span className="text-slate-500">{c.slug}</span> },
    {
      key: 'status',
      header: 'الحالة',
      render: (c) => (c.isActive ? 'نشط' : 'معطل'),
    },
    {
      key: 'actions',
      header: 'إجراءات',
      render: (c) => (
        <TableActions
          actions={[
            {
              label: 'تعديل',
              icon: 'mdi:pencil-outline',
              variant: 'edit',
              onClick: () => openEdit(c),
            },
            {
              label: 'حذف',
              icon: 'mdi:delete-outline',
              variant: 'danger',
              onClick: async () => {
                if (await confirmDelete(`حذف «${c.nameAr}»؟`)) {
                  await adminApi.deleteCategory(c.id);
                  load();
                }
              },
            },
          ]}
        />
      ),
    },
  ];

  const categoryBulkActions: BulkAction[] = [
    {
      id: 'delete',
      label: 'حذف المحدّد',
      icon: 'mdi:delete-outline',
      variant: 'danger',
      confirm: 'حذف {count} تصنيف؟ التصنيفات التي تحتوي منتجات أو فروع لن تُحذف.',
      onAction: async (ids) => {
        const { data } = await adminApi.bulkDeleteCategories(ids);
        reportBulkResult(data, 'حذف التصنيفات');
        clearSelection();
        load();
      },
    },
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="التصنيفات"
        description="أضف، عدّل، أو احذف التصنيفات — اختر التصنيف الأب من القائمة"
        actions={
          <button type="button" onClick={() => setShowForm(!showForm)} className="btn-primary">
            <Icon icon={showForm ? 'mdi:close' : 'mdi:folder-plus-outline'} />
            {showForm ? 'إغلاق' : 'تصنيف جديد'}
          </button>
        }
      />

      {showForm && (
        <form onSubmit={onCreate} className="admin-card mb-8 space-y-6 p-6 sm:p-8">
          <h3 className="flex items-center gap-2 font-bold text-slate-900">
            <Icon icon="mdi:folder-plus" className="text-primary text-xl" />
            إضافة تصنيف
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">الاسم بالعربية *</span>
              <input required className="input-field" value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">الاسم بالإنجليزية *</span>
              <input required className="input-field" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-slate-600">تصنيف أب</span>
              <select className="select-field" value={parentId} onChange={(e) => setParentId(e.target.value)}>
                <option value="">— رئيسي —</option>
                {flat.map((c) => (
                  <option key={c.id} value={c.id}>
                    {'—'.repeat(c.depth)} {c.nameAr}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <IconPicker value={icon} onChange={setIcon} />
          <ProductImageUpload
            files={imageFile}
            onChange={setImageFile}
            cloudinaryEnabled={cloudinaryEnabled}
            maxImages={1}
            label="صورة التصنيف (اختياري)"
            folderHint="Cloudinary / categories"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'جاري الحفظ...' : 'حفظ التصنيف'}
          </button>
        </form>
      )}

      <DataTable
        columns={columns}
        data={flat}
        rowKey={(c) => c.id}
        emptyMessage="لا توجد تصنيفات"
        selectable
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        bulkActions={categoryBulkActions}
      />

      <Modal open={Boolean(editId)} title="تعديل التصنيف" onClose={() => setEditId(null)} wide>
        <form onSubmit={onEditSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">الاسم بالعربية *</span>
              <input required className="input-field" value={editNameAr} onChange={(e) => setEditNameAr(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">الاسم بالإنجليزية *</span>
              <input required className="input-field" value={editNameEn} onChange={(e) => setEditNameEn(e.target.value)} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-slate-600">تصنيف أب</span>
              <select className="select-field" value={editParentId} onChange={(e) => setEditParentId(e.target.value)}>
                <option value="">— رئيسي —</option>
                {flatForEdit.map((c) => (
                  <option key={c.id} value={c.id}>
                    {'—'.repeat(c.depth)} {c.nameAr}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 sm:col-span-2">
              <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
              <span className="text-sm">نشط في المتجر</span>
            </label>
          </div>
          <IconPicker value={editIcon} onChange={setEditIcon} />
          {cloudinaryEnabled && (
            <ProductImageUpload
              files={editImage}
              onChange={setEditImage}
              cloudinaryEnabled
              maxImages={1}
              label="صورة جديدة (اختياري)"
              folderHint="يستبدل الصورة الحالية عند الرفع"
            />
          )}
          {editError && <p className="text-sm text-red-600">{editError}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={editSaving} className="btn-primary">
              {editSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
            <button type="button" onClick={() => setEditId(null)} className="btn-secondary">
              إلغاء
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
