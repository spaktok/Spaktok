import { useState, useEffect, useCallback } from 'react';
import { LocalStorage } from '@/utils';

export function useAsyncStorage<T>(key: string, initialValue?: T) {
  const [value, setValue] = useState<T | null>(initialValue ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadValue = async () => {
      try {
        setLoading(true);
        const storedValue = await LocalStorage.getItem<T>(key);
        if (storedValue) {
          setValue(storedValue);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    loadValue();
  }, [key]);

  const setStoredValue = useCallback(
    async (newValue: T | null) => {
      try {
        setValue(newValue);
        if (newValue !== null) {
          await LocalStorage.setItem(key, newValue);
        } else {
          await LocalStorage.removeItem(key);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    },
    [key]
  );

  return {
    value,
    loading,
    error,
    setStoredValue,
  };
}
