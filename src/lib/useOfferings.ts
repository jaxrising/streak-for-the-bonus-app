import { useState, useEffect, useCallback } from 'react';
import type { Offering } from '../types';
import { getOfferings, getCachedOfferings, REFRESH_INTERVAL_MS } from './draftKingsApi';

export function useOfferings() {
  const [offerings, setOfferings] = useState<Offering[]>(getCachedOfferings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOfferings(force);
      setOfferings(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch offerings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(() => refresh(), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const handleFocus = () => refresh();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refresh]);

  return { offerings, loading, error, refresh };
}
