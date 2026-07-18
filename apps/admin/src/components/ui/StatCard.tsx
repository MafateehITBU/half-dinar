import { Icon } from '@iconify/react';

interface StatCardProps {
  label: string;
  value: string;
  icon?: string;
  highlight?: boolean;
}

export function StatCard({ label, value, icon, highlight }: StatCardProps) {
  return (
    <div
      className={`admin-card flex items-start gap-4 p-5 ${highlight ? 'border-amber-200 bg-amber-50/80' : ''}`}
    >
      {icon && (
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${highlight ? 'bg-amber-100 text-amber-700' : 'bg-primary-50 text-primary-700'}`}>
          <Icon icon={icon} className="text-2xl" />
        </span>
      )}
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      </div>
    </div>
  );
}
