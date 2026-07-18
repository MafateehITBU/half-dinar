import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: { label: string; to: string };
  children?: ReactNode;
}

export function EmptyState({ icon, title, description, action, children }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-brand-cream ring-2 ring-brand-sand">
        <Icon icon={icon} className="text-4xl text-brand-green" />
      </span>
      <h3 className="font-display text-xl font-bold text-brand-ink">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-brand-muted">{description}</p>}
      {action && (
        <Link to={action.to} className="btn-primary mt-6">
          {action.label}
        </Link>
      )}
      {children}
    </div>
  );
}
