import { Icon } from '@iconify/react';
import type { PickerProduct } from './ProductPicker';

interface ProductMultiPickerProps {
  products: PickerProduct[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  search: string;
  onSearchChange: (q: string) => void;
}

export function ProductMultiPicker({
  products,
  selectedIds,
  onChange,
  search,
  onSearchChange,
}: ProductMultiPickerProps) {
  const filtered = products.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return p.nameAr.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
  });

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((x) => x !== id));
    else onChange([...selectedIds, id]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary-50/40 p-3 text-sm text-slate-700">
        <Icon icon="mdi:checkbox-multiple-marked-outline" className="shrink-0 text-xl text-primary" />
        <span>اختر المنتجات المشمولة بالحملة — بدون نسخ معرّفات.</span>
      </div>
      <input
        type="search"
        className="input-field"
        placeholder="بحث بالاسم أو SKU..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      {selectedIds.length > 0 && (
        <p className="text-xs font-bold text-emerald-800">مختار: {selectedIds.length} منتج</p>
      )}
      <ul className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
        {filtered.map((p) => {
          const on = selectedIds.includes(p.id);
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => toggle(p.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-right text-sm transition ${
                  on ? 'bg-primary-50 ring-1 ring-primary/30' : 'hover:bg-slate-50'
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                    on ? 'border-primary bg-primary text-white' : 'border-slate-300'
                  }`}
                >
                  {on && <Icon icon="mdi:check" className="text-sm" />}
                </span>
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded bg-slate-100">
                    <Icon icon="mdi:package-variant" className="text-slate-400" />
                  </span>
                )}
                <span className="flex-1 font-medium">{p.nameAr}</span>
                <span className="text-xs text-slate-500">{p.sku}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
