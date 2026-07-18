const VARIANTS: Record<string, string> = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-800',
  danger: 'bg-red-50 text-red-700',
  primary: 'bg-primary-50 text-primary-800',
};

export function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: keyof typeof VARIANTS }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${VARIANTS[variant] ?? VARIANTS.default}`}>
      {children}
    </span>
  );
}
