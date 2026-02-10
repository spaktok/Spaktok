import { useState, useCallback, useRef } from 'react';
import { Filter, UserFilter, FaceDetectionResult } from '@/types/filters';
import { filtersService } from '@/services/filters';

interface UseFiltersOptions {
  autoLoad?: boolean;
  category?: string;
}

export const useFilters = (options: UseFiltersOptions = {}) => {
  const { autoLoad = true, category } = options;
  
  const [filters, setFilters] = useState<Filter[]>([]);
  const [trendingFilters, setTrendingFilters] = useState<Filter[]>([]);
  const [savedFilters, setSavedFilters] = useState<UserFilter[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<Filter | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const processingRef = useRef(false);

  const loadFilters = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await filtersService.getFilters(category);
      setFilters(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  const loadTrendingFilters = useCallback(async () => {
    try {
      const data = await filtersService.getTrendingFilters();
      setTrendingFilters(data);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const loadSavedFilters = useCallback(async () => {
    try {
      const data = await filtersService.getSavedFilters();
      setSavedFilters(data);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const saveFilter = useCallback(async (filterId: string) => {
    try {
      const saved = await filtersService.saveFilter(filterId);
      setSavedFilters((prev) => [...prev, saved]);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const unsaveFilter = useCallback(async (filterId: string) => {
    try {
      await filtersService.unsaveFilter(filterId);
      setSavedFilters((prev) => prev.filter((f) => f.filterId !== filterId));
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const searchFilters = useCallback(async (query: string) => {
    try {
      setIsLoading(true);
      const data = await filtersService.searchFilters(query);
      setFilters(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const applyFilter = useCallback(
    async (frameData: any, filterId: string, intensity = 100) => {
      if (processingRef.current) return null;

      try {
        processingRef.current = true;
        const result = await filtersService.processFrameWithFilter(frameData, filterId, intensity);
        return result;
      } catch (err: any) {
        setError(err.message);
        return null;
      } finally {
        processingRef.current = false;
      }
    },
    []
  );

  const detectFaces = useCallback(async (frameData: any): Promise<FaceDetectionResult | null> => {
    try {
      const result = await filtersService.detectFaces(frameData);
      return result;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  const rateFilter = useCallback(async (filterId: string, rating: number) => {
    try {
      await filtersService.rateFilter(filterId, rating);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const recordFilterUsage = useCallback(async (filterId: string, duration: number) => {
    try {
      await filtersService.recordFilterUsage(filterId, duration);
    } catch (err: any) {
      console.error('Failed to record filter usage:', err);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-load on mount
  if (autoLoad && filters.length === 0 && !isLoading) {
    loadFilters();
  }

  return {
    filters,
    trendingFilters,
    savedFilters,
    selectedFilter,
    isLoading,
    error,
    setSelectedFilter,
    loadFilters,
    loadTrendingFilters,
    loadSavedFilters,
    saveFilter,
    unsaveFilter,
    searchFilters,
    applyFilter,
    detectFaces,
    rateFilter,
    recordFilterUsage,
    clearError,
  };
};
