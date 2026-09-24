import type { PaginationMeta } from '@half-dinar/shared';

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, totalPages, total, limit } = pagination;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
      <span>
        عرض {from}–{to} من {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1 || total === 0}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40 hover:bg-slate-50"
        >
          السابق
        </button>
        <span className="min-w-[5rem] text-center font-medium text-slate-800">
          {total === 0 ? '0 / 0' : `${page} / ${totalPages}`}
        </span>
        <button
          type="button"
          disabled={page >= totalPages || total === 0}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40 hover:bg-slate-50"
        >
          التالي
        </button>
      </div>
    </div>
  );
}
