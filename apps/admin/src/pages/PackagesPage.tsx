import { FormEvent, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { AdminLayout } from '../components/AdminLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { ProductImageUpload } from '../components/ProductImageUpload';
import { ProductPicker, type PickerProduct, type SelectedPackageItem } from '../components/ProductPicker';
import { Modal } from '../components/ui/Modal';
import { DataTable, type BulkAction, type Column } from '../components/ui/DataTable';
import { TableActions } from '../components/ui/TableActions';
import { useTableSelection } from '../hooks/useTableSelection';
import { reportBulkResult } from '../lib/bulk';
import { confirmDelete } from '../lib/confirm';
import { adminApi } from '../lib/api';

type PackageRow = { id: string; slug: string; nameAr: string; price: number; savings: number };

export function PackagesPage() {
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [pickerProducts, setPickerProducts] = useState<PickerProduct[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedPackageItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState<File[]>([]);
  const [cloudinaryEnabled, setCloudinaryEnabled] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editNameAr, setEditNameAr] = useState('');
  const [editNameEn, setEditNameEn] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editItems, setEditItems] = useState<SelectedPackageItem[]>([]);
  const [editSearch, setEditSearch] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const { selectedIds, setSelectedIds, clearSelection } = useTableSelection(packages);

  const load = async () => {
    const [p, picker] = await Promise.all([adminApi.getPackages(), adminApi.getProductPicker()]);
    setPackages(p.data as typeof packages);
    setPickerProducts(picker.data);
  };

  useEffect(() => {
    load();
    adminApi.getProductMediaConfig().then((r) => setCloudinaryEnabled(r.data.cloudinary));
  }, []);

  const openEdit = async (id: string) => {
    setEditError('');
    try {
      const { data } = await adminApi.getPackage(id);
      const pkg = data as {
        nameAr: string;
        nameEn: string;
        price: number;
        items: { productId: string; quantity: number }[];
      };
      setEditNameAr(pkg.nameAr);
      setEditNameEn(pkg.nameEn);
      setEditPrice(String(pkg.price));
      setEditItems(pkg.items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
      setEditId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل الباقة');
    }
  };

  const saveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    if (editItems.length === 0) {
      setEditError('اختر منتجاً واحداً على الأقل');
      return;
    }
    setEditSaving(true);
    setEditError('');
    try {
      await adminApi.updatePackage(editId, {
        nameAr: editNameAr,
        nameEn: editNameEn || editNameAr,
        price: Number(editPrice),
        items: editItems,
      });
      setEditId(null);
      load();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'فشل التحديث');
    } finally {
      setEditSaving(false);
    }
  };

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (selectedItems.length === 0) {
      setError('اختر منتجاً واحداً على الأقل من القائمة');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nameAr,
        nameEn: nameEn || nameAr,
        price,
        items: selectedItems,
      };
      if (imageFile[0] && cloudinaryEnabled) {
        await adminApi.createPackageWithImage(payload, imageFile[0]);
      } else {
        await adminApi.createPackage({
          nameAr: payload.nameAr,
          nameEn: payload.nameEn,
          price: Number(price),
          isActive: true,
          items: selectedItems,
        });
      }
      setNameAr('');
      setNameEn('');
      setPrice('');
      setImageFile([]);
      setSelectedItems([]);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل إنشاء الباقة');
    } finally {
      setSaving(false);
    }
  };

  const packageColumns: Column<PackageRow>[] = [
    { key: 'name', header: 'الباقة', render: (p) => <span className="font-medium">{p.nameAr}</span> },
    { key: 'price', header: 'السعر', render: (p) => `${p.price.toFixed(2)} د.أ` },
    { key: 'savings', header: 'التوفير', render: (p) => `${p.savings.toFixed(2)} د.أ` },
    {
      key: 'actions',
      header: 'إجراءات',
      render: (p) => (
        <TableActions
          actions={[
            {
              label: 'تعديل',
              icon: 'mdi:pencil-outline',
              variant: 'edit',
              onClick: () => openEdit(p.id),
            },
            {
              label: 'حذف',
              icon: 'mdi:delete-outline',
              variant: 'danger',
              onClick: async () => {
                if (await confirmDelete(`حذف «${p.nameAr}»؟`)) {
                  await adminApi.deletePackage(p.id);
                  load();
                }
              },
            },
          ]}
        />
      ),
    },
  ];

  const packageBulkActions: BulkAction[] = [
    {
      id: 'delete',
      label: 'حذف المحدّد',
      icon: 'mdi:delete-outline',
      variant: 'danger',
      confirm: 'حذف {count} باقة؟',
      onAction: async (ids) => {
        const { data } = await adminApi.bulkDeletePackages(ids);
        reportBulkResult(data, 'حذف الباقات');
        clearSelection();
        load();
      },
    },
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="الباقات"
        description="جمّع منتجات موجودة في باقة — اختر من القائمة بدون نسخ معرّفات UUID"
        actions={
          <button type="button" onClick={() => setShowForm(!showForm)} className="btn-primary">
            <Icon icon={showForm ? 'mdi:close' : 'mdi:gift-outline'} />
            {showForm ? 'إغلاق' : 'باقة جديدة'}
          </button>
        }
      />

      {showForm && (
        <form onSubmit={create} className="admin-card mb-8 space-y-6 p-6 sm:p-8">
          <h3 className="flex items-center gap-2 font-bold text-slate-900">
            <Icon icon="mdi:gift" className="text-xl text-primary" />
            إنشاء باقة
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">اسم الباقة (عربي) *</span>
              <input required className="input-field" value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">اسم الباقة (إنجليزي)</span>
              <input className="input-field" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">سعر الباقة (د.أ) *</span>
              <input
                required
                type="number"
                min="0"
                step="0.001"
                className="input-field"
                dir="ltr"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              {selectedItems.length > 0 && (
                <span className="mt-1 block text-xs text-slate-500">
                  أقل من إجمالي المنتجات = توفير للعميل
                </span>
              )}
            </label>
          </div>

          <fieldset>
            <legend className="mb-3 text-sm font-bold text-slate-800">منتجات الباقة *</legend>
            <ProductPicker
              products={pickerProducts}
              selected={selectedItems}
              onChange={setSelectedItems}
              search={productSearch}
              onSearchChange={setProductSearch}
              packagePrice={price === '' ? undefined : Number(price)}
            />
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-sm font-bold text-slate-800">صورة الباقة (اختياري)</legend>
            <ProductImageUpload
              files={imageFile}
              onChange={setImageFile}
              cloudinaryEnabled={cloudinaryEnabled}
              maxImages={1}
              label="صورة الباقة"
              folderHint="Cloudinary / packages"
            />
          </fieldset>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={saving || pickerProducts.length === 0} className="btn-primary">
            {saving ? 'جاري الإنشاء...' : 'إنشاء الباقة'}
          </button>
        </form>
      )}

      <section>
        <h3 className="mb-4 font-bold text-slate-900">الباقات الحالية</h3>
        <DataTable
          columns={packageColumns}
          data={packages}
          rowKey={(p) => p.id}
          emptyMessage="لا توجد باقات بعد"
          selectable
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          bulkActions={packageBulkActions}
        />
      </section>

      <Modal open={Boolean(editId)} title="تعديل الباقة" onClose={() => setEditId(null)} wide>
        <form onSubmit={saveEdit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">اسم الباقة (عربي) *</span>
              <input required className="input-field" value={editNameAr} onChange={(e) => setEditNameAr(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">اسم الباقة (إنجليزي)</span>
              <input className="input-field" value={editNameEn} onChange={(e) => setEditNameEn(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">السعر (د.أ) *</span>
              <input
                required
                type="number"
                min="0"
                step="0.001"
                className="input-field"
                dir="ltr"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
              />
            </label>
          </div>
          <ProductPicker
            products={pickerProducts}
            selected={editItems}
            onChange={setEditItems}
            search={editSearch}
            onSearchChange={setEditSearch}
            packagePrice={editPrice === '' ? undefined : Number(editPrice)}
          />
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
