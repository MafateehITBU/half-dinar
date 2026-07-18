import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import type { ProductImage, ProductSummary } from '@half-dinar/shared';
import { AdminLayout } from '../components/AdminLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, type BulkAction, type Column } from '../components/ui/DataTable';
import { TableActions } from '../components/ui/TableActions';
import { useTableSelection } from '../hooks/useTableSelection';
import { reportBulkResult } from '../lib/bulk';
import { confirmDelete } from '../lib/confirm';
import { AddProductForm, emptyProductForm, type AddProductFormState } from '../components/AddProductForm';
import { ProductImagesEditor } from '../components/ProductImagesEditor';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { adminApi } from '../lib/api';

interface Category {
  id: string;
  nameAr: string;
  children?: Category[];
}

function flattenCategories(nodes: Category[]): { id: string; nameAr: string }[] {
  return nodes.flatMap((n) => [{ id: n.id, nameAr: n.nameAr }, ...flattenCategories(n.children ?? [])]);
}

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<AddProductFormState>(emptyProductForm());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [cloudinaryEnabled, setCloudinaryEnabled] = useState(false);
  const [maxImages, setMaxImages] = useState(10);
  const addMode = searchParams.get('add') === '1' || searchParams.get('new') === '1';
  const [showForm, setShowForm] = useState(addMode);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AddProductFormState>(emptyProductForm());
  const [editImages, setEditImages] = useState<ProductImage[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchProducts = useCallback(
    (p: number, limit: number) =>
      adminApi.getProducts(p, limit) as Promise<{ data: ProductSummary[]; pagination: import('@half-dinar/shared').PaginationMeta }>,
    [],
  );
  const { items, setPage, pagination, loading, reload } = usePaginatedList<ProductSummary>(fetchProducts);
  const { selectedIds, setSelectedIds, clearSelection } = useTableSelection(items, pagination?.page);

  useEffect(() => {
    adminApi.getCategories().then((r) => setCategories(r.data as Category[]));
    adminApi.getProductMediaConfig().then((r) => {
      setCloudinaryEnabled(r.data.cloudinary);
      setMaxImages(r.data.maxImages);
    });
  }, []);

  useEffect(() => {
    if (addMode) setShowForm(true);
  }, [addMode]);

  const flatCats = flattenCategories(categories);

  const openAddForm = () => {
    setShowForm(true);
    setSearchParams({ add: '1' });
  };

  const closeAddForm = () => {
    setShowForm(false);
    setSearchParams({});
    setError('');
  };

  const openEdit = async (id: string) => {
    setEditError('');
    try {
      const { data } = await adminApi.getProduct(id);
      const p = data as {
        sku: string;
        nameAr: string;
        nameEn: string;
        descriptionAr: string | null;
        descriptionEn: string | null;
        price: number;
        stockQuantity: number;
        category: { id: string };
        images?: ProductImage[];
        isFeatured?: boolean;
      };
      setEditForm({
        sku: p.sku,
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        descriptionAr: p.descriptionAr ?? '',
        descriptionEn: p.descriptionEn ?? '',
        price: String(p.price),
        stockQuantity: String(p.stockQuantity),
        categoryId: p.category.id,
        isFeatured: p.isFeatured ?? false,
      });
      setEditImages(p.images ?? []);
      setEditId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل المنتج');
    }
  };

  const onEditSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setEditError('');
    setEditSaving(true);
    try {
      await adminApi.updateProduct(editId, {
        sku: editForm.sku.trim(),
        nameAr: editForm.nameAr.trim(),
        nameEn: editForm.nameEn.trim(),
        descriptionAr: editForm.descriptionAr.trim() || undefined,
        descriptionEn: editForm.descriptionEn.trim() || undefined,
        price: Number(editForm.price),
        stockQuantity: Number(editForm.stockQuantity),
        categoryId: editForm.categoryId,
        isFeatured: editForm.isFeatured,
      });
      setEditId(null);
      reload();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'فشل التحديث');
    } finally {
      setEditSaving(false);
    }
  };

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        nameAr: form.nameAr.trim(),
        nameEn: form.nameEn.trim(),
        descriptionAr: form.descriptionAr.trim(),
        descriptionEn: form.descriptionEn.trim(),
        price: form.price,
        stockQuantity: form.stockQuantity,
        categoryId: form.categoryId,
        isFeatured: form.isFeatured,
      };

      if (imageFiles.length > 0) {
        if (!cloudinaryEnabled) {
          setError('فعّل Cloudinary في apps/api/.env لرفع الصور');
          return;
        }
        await adminApi.createProductWithImages(payload, imageFiles);
      } else {
        await adminApi.createProduct({
          ...payload,
          descriptionAr: payload.descriptionAr || undefined,
          descriptionEn: payload.descriptionEn || undefined,
          price: Number(form.price),
          stockQuantity: Number(form.stockQuantity),
          isActive: true,
          isFeatured: form.isFeatured,
        });
      }

      setForm(emptyProductForm());
      setImageFiles([]);
      closeAddForm();
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل إضافة المنتج');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<ProductSummary>[] = [
    {
      key: 'product',
      header: 'المنتج',
      render: (p) => (
        <div className="flex items-center gap-3">
          {p.imageUrl ? (
            <img src={p.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <Icon icon="mdi:image-off-outline" />
            </span>
          )}
          <span className="font-medium">{p.nameAr}</span>
          {p.isFeatured && (
            <Badge variant="warning" >
              <Icon icon="mdi:star" className="inline text-xs" /> مميز
            </Badge>
          )}
        </div>
      ),
    },
    { key: 'sku', header: 'SKU', render: (p) => <span className="font-mono text-xs">{p.sku}</span> },
    { key: 'price', header: 'السعر', render: (p) => `${p.price.toFixed(2)} د.أ` },
    { key: 'stock', header: 'المخزون', render: (p) => p.stockQuantity },
    {
      key: 'actions',
      header: 'إجراءات',
      render: (p) => (
        <TableActions
          actions={[
            {
              label: p.isFeatured ? 'إلغاء التمييز' : 'تمييز',
              icon: p.isFeatured ? 'mdi:star-off-outline' : 'mdi:star-outline',
              variant: 'warning',
              onClick: async () => {
                await adminApi.updateProduct(p.id, { isFeatured: !p.isFeatured });
                reload();
              },
            },
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
                  await adminApi.deleteProduct(p.id);
                  reload();
                }
              },
            },
          ]}
        />
      ),
    },
  ];

  const productBulkActions: BulkAction[] = [
    {
      id: 'delete',
      label: 'حذف المحدّد',
      icon: 'mdi:delete-outline',
      variant: 'danger',
      confirm: 'حذف {count} منتج؟ لا يمكن التراجع.',
      onAction: async (ids) => {
        const { data } = await adminApi.bulkDeleteProducts(ids);
        await reportBulkResult(data, 'حذف المنتجات');
        clearSelection();
        reload();
      },
    },
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="المنتجات"
        description="أضف منتجات وعلّم المفضّلة بـ «منتج مميز» لتظهر في الصفحة الرئيسية"
        actions={
          !showForm ? (
            <button type="button" onClick={openAddForm} className="btn-primary shadow-md">
              <Icon icon="mdi:plus-circle" className="text-lg" />
              إضافة منتج جديد
            </button>
          ) : (
            <button type="button" onClick={closeAddForm} className="btn-secondary">
              <Icon icon="mdi:close" />
              إغلاق النموذج
            </button>
          )
        }
      />

      {showForm && (
        <section className="admin-card mb-8 p-6 sm:p-8" id="add-product">
          <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
            <Icon icon="mdi:plus-box-outline" className="text-primary text-2xl" />
            نموذج إضافة منتج
          </h3>
          <AddProductForm
            form={form}
            onChange={setForm}
            imageFiles={imageFiles}
            onImageFilesChange={setImageFiles}
            cloudinaryEnabled={cloudinaryEnabled}
            maxImages={maxImages}
            categories={flatCats}
            error={error}
            saving={saving}
            onSubmit={onCreate}
            onCancel={closeAddForm}
          />
        </section>
      )}

      {!showForm && items.length === 0 && !loading && (
        <div className="admin-card mb-8 flex flex-col items-center gap-4 p-10 text-center">
          <Icon icon="mdi:package-variant-closed" className="text-6xl text-slate-300" />
          <div>
            <p className="text-lg font-bold text-slate-800">لا توجد منتجات بعد</p>
            <p className="mt-1 text-sm text-slate-500">اضغط «إضافة منتج جديد» في الأعلى لبدء الكتالوج</p>
          </div>
        </div>
      )}

      <section>
        <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-800">
          <Icon icon="mdi:format-list-bulleted" />
          قائمة المنتجات
        </h3>
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          rowKey={(p) => p.id}
          pagination={pagination}
          onPageChange={setPage}
          emptyMessage="لا توجد منتجات — استخدم «إضافة منتج جديد» أعلاه"
          selectable
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          bulkActions={productBulkActions}
        />
      </section>

      <Modal open={Boolean(editId)} title="تعديل المنتج" onClose={() => setEditId(null)} wide>
        <AddProductForm
          form={editForm}
          onChange={setEditForm}
          imageFiles={[]}
          onImageFilesChange={() => {}}
          cloudinaryEnabled={false}
          categories={flatCats}
          error={editError}
          saving={editSaving}
          onSubmit={onEditSave}
          onCancel={() => setEditId(null)}
          compact
          showSku
          showImageUpload={false}
          submitLabel="حفظ التعديلات"
          headerTitle="تعديل المنتج"
          headerHint="عدّل الحقول ثم احفظ. يمكنك إدارة الصور أدناه."
        />
        {editId && (
          <ProductImagesEditor
            productId={editId}
            images={editImages}
            cloudinaryEnabled={cloudinaryEnabled}
            maxImages={maxImages}
            onChange={setEditImages}
          />
        )}
      </Modal>
    </AdminLayout>
  );
}
