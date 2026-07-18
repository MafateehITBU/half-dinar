import { Icon } from '@iconify/react';

export type TableAction = {
  label: string;
  icon: string;
  onClick: () => void;
  variant?: 'default' | 'edit' | 'danger' | 'warning';
  disabled?: boolean;
  title?: string;
};

export function TableActions({ actions }: { actions: TableAction[] }) {
  if (actions.length === 0) return null;

  return (
    <div className="table-actions" onClick={(e) => e.stopPropagation()}>
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          title={action.title ?? action.label}
          disabled={action.disabled}
          className={`table-action-btn table-action-btn--${action.variant ?? 'default'}`}
          onClick={action.onClick}
        >
          <Icon icon={action.icon} className="text-base shrink-0" aria-hidden />
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}
