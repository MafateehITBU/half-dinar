import { useCallback, useEffect, useState } from 'react';
import type { PaginationMeta } from '@half-dinar/shared';

const DEFAULT_PAGINATION: PaginationMeta = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
};

export function usePaginatedList<T>(
  fetcher: (page: number, limit: number) => Promise<{ data: T[]; pagination?: PaginationMeta }>,
  deps: unknown[] = [],
  limit = 20,
) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ ...DEFAULT_PAGINATION, limit });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const depsKey = JSON.stringify(deps);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetcher(page, limit);
      setItems(result.data);
      setPagination(result.pagination ?? { ...DEFAULT_PAGINATION, page, limit, total: result.data.length });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل التحميل');
      setItems([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- depsKey tracks filter changes
  }, [page, limit, depsKey, fetcher]);

  useEffect(() => {
    setPage(1);
  }, [depsKey]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    items,
    page,
    setPage,
    pagination,
    loading,
    error,
    reload: load,
    limit,
  };
}
