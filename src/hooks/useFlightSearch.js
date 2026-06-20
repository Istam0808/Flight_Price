import { useState, useCallback } from 'react';
import { generateDateRange } from '@/lib/utils';

export function useFlightSearch() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState(null);

  const search = useCallback(async ({ from, to, startDate, days, sessionCookie }) => {
    setLoading(true);
    setError(null);
    setResults({});

    const dates = generateDateRange(startDate, days);
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...(sessionCookie && { 'x-b2b-session-cookie': sessionCookie }),
    };

    try {
      const searchPromises = dates.map((date) =>
        fetch('/api/search', {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify({ from, to, date }),
        }).then((r) => r.json()),
      );

      setProgress('Инициализация поиска...');
      const searchResults = await Promise.all(searchPromises);

      const offersPromises = searchResults.map(async ({ request_id }, idx) => {
        if (!request_id) return { date: dates[idx], flights: [] };

        setProgress(`Загружаем рейсы (${idx + 1}/${dates.length})...`);

        const res = await fetch('/api/offers', {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify({ request_id, carrier_code: 'all' }),
        });

        const data = await res.json();
        return { date: dates[idx], flights: data.flights || [] };
      });

      const allResults = await Promise.all(offersPromises);

      const grouped = {};
      allResults.forEach(({ date, flights }) => {
        grouped[date] = flights;
      });

      setResults(grouped);
      setProgress('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { search, results, loading, progress, error };
}
