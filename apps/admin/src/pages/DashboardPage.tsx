import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import type { AnalyticsDashboard } from '@half-dinar/shared';
import { AdminLayout } from '../components/AdminLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { adminApi } from '../lib/api';

const STATUS_AR: Record<string, string> = {
  pending: 'قيد الانتظار',
  processing: 'معالجة',
  paid: 'مدفوع',
  shipped: 'شحن',
  delivered: 'تسليم',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  refunded: 'مسترد',
};

const WORKFLOW = [
  {
    step: 1,
    title: 'تصنيف + صورة',
    desc: 'أنشئ أقسام المتجر مع صورة لكل قسم',
    to: '/categories',
    query: '',
    icon: 'mdi:folder-plus-outline',
    color: 'bg-violet-500',
  },
  {
    step: 2,
    title: 'منتج + صور',
    desc: 'أضف المنتجات وارفع الصور إلى Cloudinary',
    to: '/products',
    query: 'add=1',
    icon: 'mdi:package-variant-plus',
    color: 'bg-primary',
  },
  {
    step: 3,
    title: 'باقة (اختياري)',
    desc: 'اختر المنتجات من قائمة — بدون UUID',
    to: '/packages',
    query: '',
    icon: 'mdi:gift-outline',
    color: 'bg-amber-500',
  },
  {
    step: 4,
    title: 'الطلبات',
    desc: 'تابع الطلبات وحدّث الحالات',
    to: '/orders',
    query: '',
    icon: 'mdi:clipboard-list-outline',
    color: 'bg-slate-600',
  },
];

export function DashboardPage() {
  const [stats, setStats] = useState<AnalyticsDashboard | null>(null);
  const [newContactCount, setNewContactCount] = useState(0);

  useEffect(() => {
    adminApi.getAnalytics().then((r) => setStats(r.data as AnalyticsDashboard));
    adminApi.getContactStats().then((r) => setNewContactCount(r.data.newCount)).catch(() => {});
  }, []);

  if (!stats) {
    return (
      <AdminLayout>
        <p className="text-slate-500">جاري التحميل...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader title="نظرة عامة" description={`ملخص آخر ${stats.periodDays} يوم — ابدأ من خطوات الإعداد أدناه`} />

      <section className="mb-8">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">سير العمل — من الصفر إلى المتجر</h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {WORKFLOW.map((w) => (
            <Link
              key={w.step}
              to={w.query ? `${w.to}?${w.query}` : w.to}
              className="admin-card group flex flex-col p-5 transition hover:border-primary/30 hover:shadow-md"
            >
              <span className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-white ${w.color}`}>
                <Icon icon={w.icon} className="text-xl" />
              </span>
              <span className="text-xs font-bold text-slate-400">الخطوة {w.step}</span>
              <span className="mt-1 font-bold text-slate-900 group-hover:text-primary-700">{w.title}</span>
              <p className="mt-2 flex-1 text-xs text-slate-500">{w.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary-700">
                فتح
                <Icon icon="mdi:arrow-left" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">إجراء سريع</h3>
        <div className="grid gap-4 lg:grid-cols-3">
          <Link
            to="/products?add=1"
            className="group relative overflow-hidden rounded-2xl border-2 border-primary bg-gradient-to-br from-primary to-primary-700 p-6 text-white shadow-lg shadow-primary/25 transition hover:shadow-xl lg:col-span-2"
          >
            <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                  <Icon icon="mdi:package-variant-plus" className="text-3xl" />
                </span>
                <div>
                  <h2 className="text-xl font-bold sm:text-2xl">إضافة منتج جديد</h2>
                  <p className="mt-1 max-w-md text-sm text-white/90">اسم، سعر، تصنيف، ورفع الصور — بدون روابط يدوية</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 self-start rounded-xl bg-white px-5 py-3 text-sm font-bold text-primary-700 shadow-sm sm:self-center">
                ابدأ
                <Icon icon="mdi:arrow-left" />
              </span>
            </div>
          </Link>
          <Link
            to="/categories"
            className="admin-card flex flex-col justify-center gap-2 p-6 transition hover:border-violet-200 hover:shadow-md"
          >
            <Icon icon="mdi:folder-plus-outline" className="text-3xl text-violet-600" />
            <span className="font-bold text-slate-900">تصنيف بصورة</span>
            <span className="text-sm text-slate-500">قبل المنتجات</span>
          </Link>
        </div>
      </section>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="mdi:cash-multiple" label="الإيرادات" value={`${stats.revenue.toFixed(2)} د.أ`} />
        <StatCard icon="mdi:cart-outline" label="الطلبات" value={String(stats.orderCount)} />
        <StatCard icon="mdi:chart-line" label="متوسط الطلب" value={`${stats.averageOrderValue.toFixed(2)} د.أ`} />
        <StatCard icon="mdi:account-plus-outline" label="عملاء جدد" value={String(stats.newCustomers)} />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon="mdi:alert-circle-outline" label="طلبات استرداد معلقة" value={String(stats.pendingRefunds)} highlight />
        <Link to="/inventory" className="block transition hover:opacity-95">
          <StatCard icon="mdi:package-variant" label="تنبيهات مخزون" value={String(stats.lowStockCount)} highlight />
        </Link>
        <Link to="/contact-messages" className="block transition hover:opacity-95">
          <StatCard icon="mdi:message-text-outline" label="رسائل تواصل جديدة" value={String(newContactCount)} highlight />
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="admin-card p-6">
          <h3 className="mb-4 font-bold text-slate-900">الطلبات حسب الحالة</h3>
          <ul className="space-y-3 text-sm">
            {Object.entries(stats.ordersByStatus).map(([status, count]) => (
              <li key={status} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0">
                <span className="text-slate-600">{STATUS_AR[status] ?? status}</span>
                <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 font-semibold">{count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="admin-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">الأكثر مبيعاً</h3>
            <Link to="/products" className="text-xs font-medium text-primary-700 hover:underline">
              المنتجات
            </Link>
          </div>
          <ul className="space-y-3 text-sm">
            {stats.topProducts.slice(0, 5).map((p) => (
              <li key={p.id} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0">
                <span>{p.nameAr}</span>
                <span className="text-slate-500">{p.soldCount} وحدة</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AdminLayout>
  );
}
