import { useState, useEffect, useCallback } from 'react';

/**
 * Simple data-fetching hook.
 * @param {() => Promise<any>} fn  — async function that returns an axios response
 * @param {any[]} deps             — dependency array (re-fetches when these change)
 */
export function useApi(fn, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fn();
      setData(res.data.data ?? res.data);
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
