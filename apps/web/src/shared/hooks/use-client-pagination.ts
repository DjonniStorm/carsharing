import { useCallback, useEffect, useMemo, useState } from "react";

export type UseClientPaginationOptions = {
  pageSize: number;
};

export function useClientPagination<T>(
  items: T[],
  options: UseClientPaginationOptions,
) {
  const { pageSize } = options;
  const [page, setPage] = useState(1);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  const pageItems = useMemo(() => {
    if (totalItems === 0) {
      return [] as T[];
    }
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize, totalItems, totalPages]);

  const rangeStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalItems);

  return {
    page,
    setPage,
    resetPage,
    pageItems,
    totalPages,
    totalItems,
    rangeStart,
    rangeEnd,
    pageSize,
  };
}
