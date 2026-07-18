import type { PickerProduct } from './ProductPicker';

interface ProductSelectProps {
  products: PickerProduct[];
  value: string;
  onChange: (productId: string) => void;
  label?: string;
  required?: boolean;
}

export function ProductSelect({ products, value, onChange, label, required }: ProductSelectProps) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>}
      <select
        className="select-field"
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— اختر منتجاً —</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nameAr} · {p.sku} · مخزون {p.stockQuantity}
          </option>
        ))}
      </select>
    </label>
  );
}
