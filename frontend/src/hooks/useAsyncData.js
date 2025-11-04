import { useCallback, useEffect, useState } from 'react';

export const useAsyncData = (asyncFn, dependencies = [], { fallback = null } = {}) => {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      setData(result);
    } catch (asyncError) {
      console.error('Async data fetch failed', asyncError);
      setError(asyncError.message);
      setData(fallback);
    } finally {
      setLoading(false);
    }
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refresh: execute };
};
