import { FormEvent, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { AdminLayout } from '../components/AdminLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTable, type Column } from '../components/ui/DataTable';
import { TableActions } from '../components/ui/TableActions';
import { ProductSelect } from '../components/ProductSelect';
import type { PickerProduct } from '../components/ProductPicker';
import { adminApi } from '../lib/api';

interface LowStockItem {
  id: string;
  sku: string;
  nameAr: string;
  stockQuantity: number;
  threshold: number;
}

export function InventoryPage() {
  const [alerts, setAlerts] = useState<LowStockItem[]>([]);
  const [products, setProducts] = useState<PickerProduct[]>([]);
  const [adjust, setAdjust] = useState({
    productId: '',
    changeQty: '',
    reason: 'restock' as 'restock' | 'adjustment' | 'refund',
    note: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => adminApi.getLowStock().then((r) => setAlerts((r.data as LowStockItem[]) ?? []));

  useEffect(() => {
    load();
    adminApi.getProductPicker().then((r) => setProducts(r.data));
  }, []);

  const submitAdjust = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await adminApi.adjustInventory({
        productId: adjust.productId,
        changeQty: Number(adjust.changeQty),
        reason: adjust.reason,
        note: adjust.note || undefined,
      });
      setAdjust({ productId: '', changeQty: '', reason: 'restock', note: '' });
      load();
      adminApi.getProductPicker().then((r) => setProducts(r.data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل التعديل');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<LowStockItem>[] = [
    { key: 'sku', header: 'SKU', render: (a) => <span className="font-mono text-xs">{a.sku}</span> },
    { key: 'name', header: 'المنتج', render: (a) => a.nameAr },
    {
      key: 'qty',
      header: 'الكمية',
      render: (a) => <span className="font-bold text-red-600">{a.stockQuantity}</span>,
    },
    { key: 'threshold', header: 'الحد', render: (a) => a.threshold },
    {
      key: 'quick',
      header: 'إجراءات',
      render: (a) => (
        <TableActions
          actions={[
            {
              label: '+10 مخزون',
              icon: 'mdi:package-variant-closed-plus',
              variant: 'edit',
              onClick: () => setAdjust({ ...adjust, productId: a.id, changeQty: '10', reason: 'restock' }),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageHeader title="المخزون" description="تنبيهات الانخفاض وتعديل الكميات — اختر المنتج من القائمة" />

      <section className="mb-10">
        <h3 className="mb-4 flex items-center gap-2 font-bold text-amber-800">
          <Icon icon="mdi:alert-outline" />
          تنبيهات انخفاض المخزون ({alerts.length})
        </h3>
        <DataTable columns={columns} data={alerts} rowKey={(a) => a.id} emptyMessage="لا توجد تنبيهات — المخزون جيد" />
      </section>

      <section className="admin-card max-w-xl p-6">
        <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
          <Icon icon="mdi:package-variant-closed-plus" />
          تعديل المخزون
        </h3>
        <form onSubmit={submitAdjust} className="space-y-4">
          <ProductSelect
            products={products}
            value={adjust.productId}
            onChange={(id) => setAdjust({ ...adjust, productId: id })}
            label="المنتج *"
            required
          />
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">التغيير (+ إضافة / − خصم) *</span>
            <input
              required
              type="number"
              className="input-field"
              dir="ltr"
              placeholder="مثال: 50 أو -5"
              value={adjust.changeQty}
              onChange={(e) => setAdjust({ ...adjust, changeQty: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">السبب</span>
            <select
              className="select-field"
              value={adjust.reason}
              onChange={(e) => setAdjust({ ...adjust, reason: e.target.value as typeof adjust.reason })}
            >
              <option value="restock">إعادة تخزين</option>
              <option value="adjustment">تعديل يدوي</option>
              <option value="refund">مرتجع</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">ملاحظة (اختياري)</span>
            <input
              className="input-field"
              value={adjust.note}
              onChange={(e) => setAdjust({ ...adjust, note: e.target.value })}
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={saving || !adjust.productId} className="btn-primary">
            {saving ? 'جاري التطبيق...' : 'تطبيق التعديل'}
          </button>
        </form>
      </section>
    </AdminLayout>
  );
}
