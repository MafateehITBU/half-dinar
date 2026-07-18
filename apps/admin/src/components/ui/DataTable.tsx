import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@iconify/react';
import { Pagination } from './Pagination';
import type { PaginationMeta } from '@half-dinar/shared';
import { confirmAction } from '../../lib/confirm';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export interface BulkAction {
  id: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  confirm?: string;
  disabled?: boolean;
  onAction: (selectedIds: string[]) => void | Promise<void>;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => string;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectedIdsChange?: (ids: string[]) => void;
  bulkActions?: BulkAction[];
  isRowSelectable?: (row: T) => boolean;
}

export function DataTable<T>({
  columns,
  data,
  loading,
  emptyMessage = 'لا توجد بيانات',
  pagination,
  onPageChange,
  onRowClick,
  rowKey,
  selectable = false,
  selectedIds = [],
  onSelectedIdsChange,
  bulkActions = [],
  isRowSelectable,
}: DataTableProps<T>) {
  const [bulkLoading, setBulkLoading] = useState<string | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const selectableRows = useMemo(
    () => data.filter((row) => !isRowSelectable || isRowSelectable(row)),
    [data, isRowSelectable],
  );

  const selectableIds = useMemo(() => selectableRows.map((row) => rowKey(row)), [selectableRows, rowKey]);

  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id));
  const someSelected = selectableIds.some((id) => selectedIds.includes(id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected && !allSelected;
    }
  }, [someSelected, allSelected]);

  const toggleAll = () => {
    if (!onSelectedIdsChange) return;
    onSelectedIdsChange(allSelected ? [] : selectableIds);
  };

  const toggleRow = (id: string) => {
    if (!onSelectedIdsChange) return;
    if (selectedIds.includes(id)) {
      onSelectedIdsChange(selectedIds.filter((x) => x !== id));
    } else {
      onSelectedIdsChange([...selectedIds, id]);
    }
  };

  const runBulkAction = async (action: BulkAction) => {
    if (selectedIds.length === 0 || action.disabled) return;
    if (action.confirm) {
      const text = action.confirm.replace('{count}', String(selectedIds.length));
      const ok = await confirmAction('تأكيد الإجراء', text, {
        variant: action.variant === 'danger' ? 'danger' : 'default',
        confirmText: action.label,
      });
      if (!ok) return;
    }
    setBulkLoading(action.id);
    try {
      await action.onAction(selectedIds);
    } finally {
      setBulkLoading(null);
    }
  };

  const colSpan = columns.length + (selectable ? 1 : 0);
  const showBulkBar = selectable && selectedIds.length > 0 && bulkActions.length > 0;

  return (
    <div className="admin-card overflow-hidden">
      {showBulkBar && (
        <div className="bulk-actions-bar">
          <p className="text-sm font-semibold text-brand-green">
            <Icon icon="mdi:checkbox-marked-outline" className="inline text-lg align-[-2px] ml-1" />
            {selectedIds.length} محدّد
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="table-action-btn table-action-btn--default"
              onClick={() => onSelectedIdsChange?.([])}
            >
              إلغاء التحديد
            </button>
            {bulkActions.map((action) => (
              <button
                key={action.id}
                type="button"
                disabled={Boolean(bulkLoading) || action.disabled}
                className={
                  action.variant === 'danger'
                    ? 'btn-danger text-xs py-2 px-3'
                    : action.variant === 'primary'
                      ? 'btn-primary text-xs py-2 px-3'
                      : 'btn-secondary text-xs py-2 px-3'
                }
                onClick={() => runBulkAction(action)}
              >
                {action.icon && <Icon icon={action.icon} />}
                {bulkLoading === action.id ? 'جاري التنفيذ...' : action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              {selectable && (
                <th className="col-checkbox">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className="table-checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="تحديد الكل"
                    disabled={selectableIds.length === 0}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th key={col.key} className={col.className ?? (col.key === 'actions' ? 'col-actions' : undefined)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colSpan} className="py-12 text-center text-slate-500">
                  جاري التحميل...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="py-12 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const id = rowKey(row);
                const canSelect = !isRowSelectable || isRowSelectable(row);
                const isSelected = selectedIds.includes(id);

                return (
                  <tr
                    key={id}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={[
                      onRowClick ? 'cursor-pointer' : '',
                      isSelected ? 'is-selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {selectable && (
                      <td className="col-checkbox" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="table-checkbox"
                          checked={isSelected}
                          disabled={!canSelect}
                          onChange={() => toggleRow(id)}
                          aria-label="تحديد الصف"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className={col.className ?? (col.key === 'actions' ? 'col-actions' : undefined)}>
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {pagination && onPageChange && (
        <Pagination pagination={pagination} onPageChange={onPageChange} />
      )}
    </div>
  );
}
