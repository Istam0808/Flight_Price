'use client';
import { useEffect, useMemo, useState } from 'react';
import SearchForm from '@/components/SearchForm/SearchForm';
import PriceTable from '@/components/PriceTable/PriceTable';
import Loader from '@/components/Loader/Loader';
import { useFlightSearch } from '@/hooks/useFlightSearch';
import { exportOffersToPdf } from '@/lib/pdf';
import styles from './page.module.scss';

const STOPS_FILTERS = [
  { value: 'all', label: 'Все рейсы' },
  { value: '0', label: 'Только прямые' },
  { value: '1', label: '1 пересадка' },
  { value: '2', label: '2 пересадки' },
];
const COOKIE_STORAGE_KEY = 'b2b_session_cookie';

export default function HomePage() {
  const { search, results, loading, progress, error } = useFlightSearch();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [stopsFilter, setStopsFilter] = useState('all');
  const [cookieValue, setCookieValue] = useState('');
  const [cookieStatus, setCookieStatus] = useState('');

  useEffect(() => {
    const savedCookie = localStorage.getItem(COOKIE_STORAGE_KEY) || '';
    setCookieValue(savedCookie);
  }, []);

  const filteredResults = useMemo(() => {
    if (stopsFilter === 'all') return results;

    const filterValue = Number(stopsFilter);
    const next = {};

    Object.entries(results).forEach(([date, flights]) => {
      next[date] = (flights || []).filter((flight) => (flight.stops ?? 0) === filterValue);
    });

    return next;
  }, [results, stopsFilter]);

  const hasRawResults = Object.keys(results).length > 0;
  const filteredFlightsCount = Object.values(filteredResults).reduce((sum, flights) => sum + flights.length, 0);
  const hasFilteredResults = filteredFlightsCount > 0;
  const selectedFilterLabel = STOPS_FILTERS.find((item) => item.value === stopsFilter)?.label || 'Все рейсы';

  const handleExportPdf = async () => {
    await exportOffersToPdf(filteredResults);
  };

  const handleCookieSave = () => {
    const normalized = cookieValue.trim();

    if (!normalized) {
      localStorage.removeItem(COOKIE_STORAGE_KEY);
      setCookieStatus('Cookie удален из localStorage');
      return;
    }

    localStorage.setItem(COOKIE_STORAGE_KEY, normalized);
    setCookieStatus('Cookie сохранен');
  };

  const handleCookieClear = () => {
    localStorage.removeItem(COOKIE_STORAGE_KEY);
    setCookieValue('');
    setCookieStatus('Cookie очищен');
  };

  const handleSearch = (form) => {
    search({ ...form, sessionCookie: cookieValue.trim() });
  };

  const closeSettings = () => {
    setSettingsOpen(false);
    setCookieStatus('');
  };

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerBrand}>
            <h1 className={styles.brandTitle}>LUMINARA VOYAGE</h1>
            <p className={styles.brandSubtitle}>Прайс-лист рейсов</p>
          </div>
          <button type="button" className={styles.settingsButton} onClick={() => setSettingsOpen(true)}>
            Настройки
          </button>
        </div>
      </header>

      <div className={styles.container}>
        <SearchForm onSearch={handleSearch} loading={loading} />

        {loading && <Loader message={progress || 'Поиск рейсов...'} />}

        {error && (
          <div className={styles.error}>
            <strong>Ошибка:</strong> {error}
          </div>
        )}

        {!loading && hasRawResults && (
          <div className={styles.actions}>
            <div className={styles.filterWrap}>
              <button type="button" className={styles.filterButton} onClick={() => setFilterOpen((prev) => !prev)}>
                Фильтр: {selectedFilterLabel}
              </button>

              {filterOpen && (
                <div className={styles.filterMenu}>
                  {STOPS_FILTERS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={`${styles.filterItem} ${stopsFilter === item.value ? styles.filterItemActive : ''}`}
                      onClick={() => {
                        setStopsFilter(item.value);
                        setFilterOpen(false);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button type="button" className={styles.exportButton} onClick={handleExportPdf} disabled={!hasFilteredResults}>
              Экспорт PDF ({filteredFlightsCount})
            </button>
          </div>
        )}

        {!loading && hasFilteredResults && <PriceTable results={filteredResults} />}

        {!loading && hasRawResults && !hasFilteredResults && (
          <div className={styles.hint}>По выбранному фильтру рейсов не найдено</div>
        )}

        {!loading && !hasRawResults && !error && (
          <div className={styles.hint}>Выберите маршрут, дату и нажмите «Найти рейсы»</div>
        )}
      </div>

      {settingsOpen && (
        <div className={styles.modalOverlay} onClick={closeSettings}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.modalClose} onClick={closeSettings} aria-label="Закрыть настройки">
              ×
            </button>
            <section className={styles.cookieCard}>
              <div className={styles.cookieHeader}>
                <h2 className={styles.cookieTitle}>B2B Session Cookie</h2>
                <span className={styles.cookieHint}>Используется для запросов вместо env</span>
              </div>
              <textarea
                className={styles.cookieInput}
                value={cookieValue}
                onChange={(e) => setCookieValue(e.target.value)}
                placeholder="etmsessid=...; laravel_session=...; XSRF-TOKEN=..."
                rows={3}
              />
              <div className={styles.cookieActions}>
                <button type="button" className={styles.cookieSave} onClick={handleCookieSave}>
                  Сохранить cookie
                </button>
                <button type="button" className={styles.cookieClear} onClick={handleCookieClear}>
                  Очистить
                </button>
              </div>
              {cookieStatus && <span className={styles.cookieStatus}>{cookieStatus}</span>}
            </section>
          </div>
        </div>
      )}
    </main>
  );
}
