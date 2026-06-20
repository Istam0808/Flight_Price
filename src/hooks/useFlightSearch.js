import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { generateDateRange } from '@/lib/utils';

function isSessionExpiredError(message) {
  return /Session expired/i.test(message || '');
}

async function parseApiResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || `Request failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data;
}

export function useFlightSearch() {
  const router = useRouter();
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
        }).then(parseApiResponse),
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

        const data = await parseApiResponse(res);
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
      if (err.status === 403 && isSessionExpiredError(err.message)) {
        router.push('/login');
        return;
      }

      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  return { search, results, loading, progress, error };
}
