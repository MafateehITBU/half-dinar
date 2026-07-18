import { useEffect, useState } from 'react';

function toResetKey(parts: unknown[]): string {
  return parts
    .map((part) => {
      if (Array.isArray(part)) {
        return part
          .map((item) =>
            item != null && typeof item === 'object' && 'id' in item
              ? String((item as { id: string }).id)
              : String(item),
          )
          .join(',');
      }
      return String(part ?? '');
    })
    .join('|');
}

/** Keeps row selection in sync with list/page changes. Pass list data and page/filter primitives. */
export function useTableSelection(...parts: unknown[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const resetKey = toResetKey(parts);

  useEffect(() => {
    setSelectedIds([]);
  }, [resetKey]);

  return {
    selectedIds,
    setSelectedIds,
    clearSelection: () => setSelectedIds([]),
  };
}
