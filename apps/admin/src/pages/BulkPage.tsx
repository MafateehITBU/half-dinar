import { useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { adminApi } from '../lib/api';

export function BulkPage() {
  const [csv, setCsv] = useState('');
  const [result, setResult] = useState<{ created: number; updated: number; errors: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const exportCsv = async () => {
    const token = localStorage.getItem('adminAccessToken');
    const res = await fetch('/api/v1/admin/bulk/products/export', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCsv = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await adminApi.importProducts(csv);
      setResult(res.data as typeof result);
    } catch (e) {
      setResult({ created: 0, updated: 0, errors: [e instanceof Error ? e.message : 'فشل الاستيراد'] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <h2 className="mb-6 text-2xl font-bold">استيراد / تصدير المنتجات</h2>

      <section className="mb-10 rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-2 font-bold">تصدير CSV</h3>
        <p className="mb-4 text-sm text-slate-500">تحميل جميع المنتجات بصيغة CSV (يتطلب تسجيل الدخول في نفس المتصفح).</p>
        <button type="button" onClick={exportCsv} className="rounded bg-primary px-4 py-2 text-white">
          تحميل products-export.csv
        </button>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-2 font-bold">استيراد CSV</h3>
        <p className="mb-4 text-sm text-slate-500">
          الأعمدة المطلوبة: sku, name_ar, price, category_slug — اختياري: name_en, stock_quantity
        </p>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          className="mb-4 h-48 w-full rounded border px-3 py-2 font-mono text-xs"
          placeholder="sku,name_ar,name_en,price,stock_quantity,category_slug..."
        />
        <button
          type="button"
          disabled={loading || !csv.trim()}
          onClick={importCsv}
          className="rounded bg-primary px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? 'جاري الاستيراد...' : 'استيراد'}
        </button>
        {result && (
          <div className="mt-4 text-sm">
            <p className="text-green-700">أُنشئ: {result.created} — حُدّث: {result.updated}</p>
            {result.errors.length > 0 && (
              <ul className="mt-2 max-h-40 overflow-auto text-red-600">
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
