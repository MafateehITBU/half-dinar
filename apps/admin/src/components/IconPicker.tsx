import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';

const POPULAR_ICONS = [
  'mdi:home-outline',
  'mdi:home-heart-outline',
  'mdi:spray-bottle',
  'mdi:broom',
  'mdi:silverware-fork-knife',
  'mdi:pot-steam-outline',
  'mdi:fridge-outline',
  'mdi:shower-head',
  'mdi:bathtub-outline',
  'mdi:soap',
  'mdi:washing-machine',
  'mdi:tshirt-crew-outline',
  'mdi:package-variant',
  'mdi:cart-outline',
  'mdi:store-outline',
  'mdi:gift-outline',
  'mdi:tag-outline',
  'mdi:star-outline',
  'mdi:leaf',
  'mdi:water-outline',
  'mdi:cup-outline',
  'mdi:lightbulb-outline',
  'mdi:hammer-wrench',
  'mdi:tools',
  'mdi:baby-carriage',
  'mdi:paw',
  'mdi:food-apple-outline',
  'mdi:coffee-outline',
  'mdi:bottle-soda-outline',
  'mdi:recycle',
  'mdi:truck-outline',
  'mdi:shield-check-outline',
];

interface IconifySearchResult {
  icons: string[];
}

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  label?: string;
}

export function IconPicker({ value, onChange, label = 'أيقونة التصنيف (Iconify)' }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [remoteIcons, setRemoteIcons] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const searchRemote = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setRemoteIcons([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.iconify.design/search?query=${encodeURIComponent(q)}&limit=40`,
      );
      const data = (await res.json()) as IconifySearchResult;
      setRemoteIcons(data.icons ?? []);
    } catch {
      setRemoteIcons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => searchRemote(query), 350);
    return () => clearTimeout(t);
  }, [query, open, searchRemote]);

  const localFiltered = POPULAR_ICONS.filter((id) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return id.toLowerCase().includes(q);
  });

  const displayIcons = query.trim().length >= 2 && remoteIcons.length > 0 ? remoteIcons : localFiltered;

  return (
    <div className="space-y-2">
      <span className="block text-xs font-medium text-slate-600">{label}</span>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-primary/30 bg-primary-50 text-2xl text-primary-700 transition hover:border-primary"
          title="اختر أيقونة"
        >
          {value ? <Icon icon={value} /> : <Icon icon="mdi:image-plus" className="text-slate-400" />}
        </button>
        {value && (
          <>
            <code className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600" dir="ltr">
              {value}
            </code>
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-xs text-red-600 hover:underline"
            >
              إزالة
            </button>
          </>
        )}
        <button type="button" onClick={() => setOpen(!open)} className="text-sm font-medium text-primary-700 hover:underline">
          {open ? 'إغلاق المعرض' : 'اختر من Iconify'}
        </button>
      </div>

      {open && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <input
            type="search"
            className="input-field mb-3"
            placeholder="ابحث: kitchen, clean, home..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            dir="ltr"
          />
          {loading && <p className="mb-2 text-xs text-slate-500">جاري البحث في Iconify...</p>}
          <p className="mb-2 text-xs text-slate-500">
            {query.trim().length >= 2
              ? 'نتائج البحث — انقر للاختيار'
              : 'أيقونات شائعة — أو ابحث بالإنجليزية (حرفين+)'}
          </p>
          <div className="grid max-h-48 grid-cols-6 gap-2 overflow-y-auto sm:grid-cols-8 md:grid-cols-10">
            {displayIcons.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onChange(id);
                  setOpen(false);
                }}
                className={`flex aspect-square items-center justify-center rounded-lg border text-xl transition ${
                  value === id
                    ? 'border-primary bg-primary-50 text-primary-700'
                    : 'border-slate-200 bg-white hover:border-primary/40'
                }`}
                title={id}
              >
                <Icon icon={id} />
              </button>
            ))}
          </div>
          {displayIcons.length === 0 && !loading && (
            <p className="text-center text-sm text-slate-500">لا توجد نتائج</p>
          )}
        </div>
      )}
    </div>
  );
}
