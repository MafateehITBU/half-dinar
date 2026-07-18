import { useMemo, useState } from 'react';
import { Icon } from '@iconify/react';

export interface PickerProduct {
  id: string;
  sku: string;
  nameAr: string;
  price: number;
  stockQuantity: number;
  imageUrl: string | null;
  categoryId: string;
  categorySlug: string;
  categoryNameAr: string;
}

export interface SelectedPackageItem {
  productId: string;
  quantity: number;
}

interface ProductPickerProps {
  products: PickerProduct[];
  selected: SelectedPackageItem[];
  onChange: (items: SelectedPackageItem[]) => void;
  search: string;
  onSearchChange: (q: string) => void;
  /** Package selling price — used to show savings vs retail total */
  packagePrice?: number;
}

function formatJod(n: number): string {
  return `${n.toFixed(2)} د.أ`;
}

export function computeSelectionTotal(
  products: PickerProduct[],
  selected: SelectedPackageItem[],
): { itemCount: number; unitCount: number; retailTotal: number } {
  const byId = new Map(products.map((p) => [p.id, p]));
  let unitCount = 0;
  let retailTotal = 0;
  for (const s of selected) {
    const p = byId.get(s.productId);
    if (!p) continue;
    unitCount += s.quantity;
    retailTotal += p.price * s.quantity;
  }
  return { itemCount: selected.length, unitCount, retailTotal };
}

export function ProductPicker({
  products,
  selected,
  onChange,
  search,
  onSearchChange,
  packagePrice,
}: ProductPickerProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const selectedMap = new Map(selected.map((s) => [s.productId, s.quantity]));

  const categories = useMemo(() => {
    const map = new Map<string, { slug: string; nameAr: string; count: number }>();
    for (const p of products) {
      const existing = map.get(p.categoryId);
      if (existing) existing.count += 1;
      else map.set(p.categoryId, { slug: p.categorySlug, nameAr: p.categoryNameAr, count: 1 });
    }
    return [...map.entries()]
      .map(([id, c]) => ({ id, ...c }))
      .sort((a, b) => a.nameAr.localeCompare(b.nameAr, 'ar'));
  }, [products]);

  const filtered = products.filter((p) => {
    if (categoryFilter !== 'all' && p.categoryId !== categoryFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.nameAr.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.categoryNameAr.includes(search.trim())
    );
  });

  const totals = computeSelectionTotal(products, selected);
  const parsedPackagePrice =
    packagePrice !== undefined && !Number.isNaN(packagePrice) ? packagePrice : null;
  const savings =
    parsedPackagePrice !== null && totals.retailTotal > 0
      ? totals.retailTotal - parsedPackagePrice
      : null;

  const toggle = (productId: string) => {
    if (selectedMap.has(productId)) {
      onChange(selected.filter((s) => s.productId !== productId));
    } else {
      onChange([...selected, { productId, quantity: 1 }]);
    }
  };

  const setQty = (productId: string, quantity: number) => {
    onChange(
      selected.map((s) =>
        s.productId === productId ? { ...s, quantity: Math.max(1, Math.min(99, quantity)) } : s,
      ),
    );
  };

  const selectAllVisible = () => {
    const visibleIds = new Set(filtered.map((p) => p.id));
    const nonVisible = selected.filter((s) => !visibleIds.has(s.productId));
    const visibleSelected = new Map(
      selected.filter((s) => visibleIds.has(s.productId)).map((s) => [s.productId, s.quantity]),
    );
    const merged = filtered.map((p) => ({
      productId: p.id,
      quantity: visibleSelected.get(p.id) ?? 1,
    }));
    onChange([...nonVisible, ...merged]);
  };

  const clearVisible = () => {
    const visibleIds = new Set(filtered.map((p) => p.id));
    onChange(selected.filter((s) => !visibleIds.has(s.productId)));
  };

  const visibleSelectedCount = filtered.filter((p) => selectedMap.has(p.id)).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary-50/40 p-3 text-sm text-slate-700">
        <Icon icon="mdi:gesture-tap" className="shrink-0 text-xl text-primary" />
        <span>اختر التصنيف ثم المنتجات — يظهر إجمالي السعر تلقائياً.</span>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              categoryFilter === 'all'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            الكل ({products.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryFilter(c.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                categoryFilter === c.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {c.nameAr} ({c.count})
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          className="input-field min-w-[12rem] flex-1"
          placeholder="بحث بالاسم أو SKU أو التصنيف..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {filtered.length > 0 && (
          <>
            <button type="button" onClick={selectAllVisible} className="btn-secondary text-xs">
              <Icon icon="mdi:checkbox-multiple-marked-outline" />
              تحديد المعروض ({filtered.length})
            </button>
            {visibleSelectedCount > 0 && (
              <button type="button" onClick={clearVisible} className="btn-secondary text-xs">
                <Icon icon="mdi:close-circle-outline" />
                إلغاء المعروض
              </button>
            )}
          </>
        )}
      </div>

      {selected.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-emerald-900">
                المختار: {totals.itemCount} منتج · {totals.unitCount} قطعة
              </p>
              <p className="mt-0.5 text-lg font-bold text-emerald-800">
                إجمالي سعر المنتجات: {formatJod(totals.retailTotal)}
              </p>
              {parsedPackagePrice !== null && parsedPackagePrice > 0 && (
                <p className="mt-1 text-xs text-emerald-700">
                  سعر الباقة: {formatJod(parsedPackagePrice)}
                  {savings !== null && (
                    <span className={savings >= 0 ? ' mr-2 font-bold text-emerald-800' : ' mr-2 font-bold text-amber-700'}>
                      · {savings >= 0 ? `توفير ${formatJod(savings)}` : `أعلى من المجموع بـ ${formatJod(-savings)}`}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
          <ul className="space-y-2">
            {selected.map((s) => {
              const p = products.find((x) => x.id === s.productId);
              if (!p) return null;
              const lineTotal = p.price * s.quantity;
              return (
                <li
                  key={s.productId}
                  className="flex flex-wrap items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-sm"
                >
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="" className="h-9 w-9 rounded object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded bg-slate-100 text-slate-400">
                      <Icon icon="mdi:package-variant" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">{p.nameAr}</p>
                    <p className="text-xs text-slate-500">
                      {p.categoryNameAr} · {formatJod(p.price)} × {s.quantity} ={' '}
                      <span className="font-bold text-slate-700">{formatJod(lineTotal)}</span>
                    </p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={s.quantity}
                    onChange={(e) => setQty(s.productId, Number(e.target.value))}
                    className="w-14 rounded-lg border px-2 py-1 text-center text-sm"
                    aria-label="الكمية"
                  />
                  <button
                    type="button"
                    onClick={() => toggle(s.productId)}
                    className="rounded p-1 text-red-600 hover:bg-red-50"
                    aria-label="إزالة"
                  >
                    <Icon icon="mdi:close" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <ul className="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-2">
        {filtered.length === 0 ? (
          <li className="py-8 text-center text-sm text-slate-500">
            {products.length === 0
              ? 'لا توجد منتجات — أضف منتجات أولاً'
              : 'لا توجد منتجات في هذا التصنيف أو البحث'}
          </li>
        ) : (
          filtered.map((p) => {
            const isOn = selectedMap.has(p.id);
            const qty = selectedMap.get(p.id) ?? 1;
            return (
              <li key={p.id}>
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                    isOn ? 'border-primary bg-white shadow-sm' : 'border-transparent bg-white hover:border-slate-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="table-checkbox"
                    checked={isOn}
                    onChange={() => toggle(p.id)}
                  />
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                      <Icon icon="mdi:package-variant" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">{p.nameAr}</p>
                    <p className="text-xs text-slate-500">
                      <span className="text-primary/80">{p.categoryNameAr}</span>
                      {' · '}
                      {p.sku} · {formatJod(p.price)} · مخزون {p.stockQuantity}
                    </p>
                  </div>
                  {isOn && (
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={qty}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setQty(p.id, Number(e.target.value))}
                      className="w-14 rounded-lg border px-2 py-1 text-center text-sm"
                      aria-label="كمية في الباقة"
                    />
                  )}
                </label>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
