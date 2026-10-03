import { useState, useCallback } from 'react';

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export function usePagination(initialLimit = 20) {
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: initialLimit,
    total: 0,
    hasMore: true,
  });

  const nextPage = useCallback(() => {
    setPagination((prev) => ({
      ...prev,
      page: prev.page + 1,
    }));
  }, []);

  const previousPage = useCallback(() => {
    setPagination((prev) => ({
      ...prev,
      page: Math.max(1, prev.page - 1),
    }));
  }, []);

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({
      ...prev,
      page: Math.max(1, page),
    }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setPagination((prev) => ({
      ...prev,
      limit,
      page: 1,
    }));
  }, []);

  const setTotal = useCallback((total: number) => {
    setPagination((prev) => ({
      ...prev,
      total,
      hasMore: prev.page * prev.limit < total,
    }));
  }, []);

  const reset = useCallback(() => {
    setPagination({
      page: 1,
      limit: initialLimit,
      total: 0,
      hasMore: true,
    });
  }, [initialLimit]);

  return {
    pagination,
    nextPage,
    previousPage,
    setPage,
    setLimit,
    setTotal,
    reset,
  };
}
