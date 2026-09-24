import { useCallback, useState } from 'react';
import { Icon } from '@iconify/react';
import { formatMoney } from '@half-dinar/shared';
import { AdminLayout } from '../components/AdminLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { Pagination } from '../components/ui/Pagination';
import { Badge } from '../components/ui/Badge';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { adminApi } from '../lib/api';
import { confirmAction, showToastError, showToastSuccess } from '../lib/confirm';

interface RefundRow {
  id: string;
  reason: string;
  status: string;
  adminNotes: string | null;
  user: { email: string; firstName: string; lastName?: string };
  order?: {
    orderNumber: string;
    total: number;
    paymentMethod?: string;
    paymentStatus?: string;
    canCardRefund?: boolean;
  };
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
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchRefunds = useCallback(
    (p: number, limit: number) =>
      adminApi.getRefunds(filter, p, limit) as Promise<{
        data: RefundRow[];
        pagination: import('@half-dinar/shared').PaginationMeta;
      }>,
    [filter],
  );

  const { items, setPage, pagination, loading, reload } = usePaginatedList<RefundRow>(
    fetchRefunds,
    [filter],
  );

  const moderate = async (
    r: RefundRow,
    status: 'approved' | 'under_review' | 'rejected',
    cardRefund: 'auto' | 'skip' = 'auto',
  ) => {
    if (status === 'approved') {
      const card = r.order?.canCardRefund;
      const ok = await confirmAction(
        cardRefund === 'auto' && card
          ? 'موافقة + استرداد عبر PayTabs؟'
          : card
            ? 'موافقة يدوية (بدون API)؟'
            : 'الموافقة على الاسترداد؟',
        cardRefund === 'auto' && card
          ? `سيتم طلب إرجاع ${formatMoney(r.order?.total)} د.أ عبر PayTabs. إذا ظهر خطأ 335 (Apple Pay / البنك لا يدعم API)، استرد من لوحة MEPS ثم استخدم «موافقة يدوية».`
          : card
            ? `لن يُستدعى PayTabs. استخدم هذا بعد استرداد المبلغ يدوياً من لوحة MEPS (شائع مع Apple Pay).`
            : `طلب COD — سيتم تعليم الطلب كمسترد. أعد المبلغ للعميل يدوياً إن لزم.`,
        { confirmText: 'موافقة', variant: card && cardRefund === 'auto' ? 'danger' : 'default' },
      );
      if (!ok) return;
    }
    if (status === 'rejected') {
      const ok = await confirmAction('رفض الطلب؟', 'سيتم إشعار العميل بالرفض.', {
        confirmText: 'رفض',
        variant: 'danger',
      });
      if (!ok) return;
    }

    setBusyId(r.id);
    try {
      await adminApi.moderateRefund(r.id, status, { cardRefund });
      await reload();
      await showToastSuccess(
        status === 'approved'
          ? cardRefund === 'auto' && r.order?.canCardRefund
            ? 'تمت الموافقة وتم إرسال استرداد البطاقة'
            : 'تمت الموافقة على الاسترداد'
          : status === 'rejected'
            ? 'تم رفض الطلب'
            : 'تم وضع الطلب قيد المراجعة',
      );
    } catch (err) {
      await showToastError(err instanceof Error ? err.message : 'فشل التحديث');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        title="طلبات الاسترداد"
        description="العميل يرسل الطلب من صفحة الطلب — أنت توافق أو ترفض. لطلبات Visa يتم الاسترداد عبر PayTabs عند الموافقة."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {['requested', 'under_review', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              filter === s
                ? 'bg-primary text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600'
            }`}
          >
            {STATUS_AR[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-500">جاري التحميل...</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          لا توجد طلبات في هذه الحالة
        </p>
      ) : (
        <>
          <ul className="space-y-4">
            {items.map((r) => (
              <li key={r.id} className="admin-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-2 text-sm">
                  <div>
                    <p className="font-bold text-slate-900">
                      {r.order?.orderNumber} — {r.user.firstName} {r.user.lastName ?? ''}
                    </p>
                    <p className="text-xs text-slate-500" dir="ltr">
                      {r.user.email}
                    </p>
                  </div>
                  <Badge
                    variant={
                      r.status === 'approved'
                        ? 'success'
                        : r.status === 'rejected'
                          ? 'danger'
                          : 'warning'
                    }
                  >
                    {STATUS_AR[r.status]}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                    {formatMoney(r.order?.total)} د.أ
                  </span>
                  {r.order?.paymentMethod === 'meps' ? (
                    <span
                      className={`rounded-full px-2.5 py-1 font-medium ${
                        r.order.canCardRefund
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      <Icon icon="mdi:credit-card" className="me-1 inline" />
                      {r.order.canCardRefund
                        ? 'Visa — استرداد تلقائي عبر PayTabs'
                        : 'بطاقة — غير جاهز للاسترداد الآلي'}
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                      <Icon icon="mdi:cash" className="me-1 inline" />
                      COD — استرداد يدوي
                    </span>
                  )}
                </div>

                <p className="mt-3 text-sm text-slate-600">{r.reason}</p>
                {r.adminNotes && (
                  <p className="mt-2 text-xs text-slate-500">ملاحظة إدارية: {r.adminNotes}</p>
                )}
                {r.evidence.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {r.evidence.map((e, i) => (
                      <a
                        key={i}
                        href={e.imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-primary-700 hover:underline"
                      >
                        دليل {i + 1}
                      </a>
                    ))}
                  </div>
                )}
                {['requested', 'under_review'].includes(r.status) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {r.order?.canCardRefund ? (
                      <>
                        <button
                          type="button"
                          className="btn-primary text-xs disabled:opacity-50"
                          disabled={busyId === r.id}
                          onClick={() => void moderate(r, 'approved', 'auto')}
                        >
                          موافقة + PayTabs
                        </button>
                        <button
                          type="button"
                          className="btn-secondary text-xs disabled:opacity-50"
                          disabled={busyId === r.id}
                          onClick={() => void moderate(r, 'approved', 'skip')}
                        >
                          موافقة يدوية (بعد MEPS)
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn-primary text-xs disabled:opacity-50"
                        disabled={busyId === r.id}
                        onClick={() => void moderate(r, 'approved', 'skip')}
                      >
                        موافقة
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-secondary text-xs disabled:opacity-50"
                      disabled={busyId === r.id}
                      onClick={() => void moderate(r, 'under_review')}
                    >
                      مراجعة
                    </button>
                    <button
                      type="button"
                      className="btn-danger text-xs disabled:opacity-50"
                      disabled={busyId === r.id}
                      onClick={() => void moderate(r, 'rejected')}
                    >
                      رفض
                    </button>
                  </div>
                )}
                {r.order?.canCardRefund && ['requested', 'under_review'].includes(r.status) && (
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                    ملاحظة: دفعات Apple Pay أحياناً ترفض الاسترداد عبر API (كود 335). استرد من لوحة MEPS ثم
                    اضغط «موافقة يدوية».
                  </p>
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
