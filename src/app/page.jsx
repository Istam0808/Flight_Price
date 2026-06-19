'use client';
import { useMemo, useState } from 'react';
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

export default function HomePage() {
  const { search, results, loading, progress, error } = useFlightSearch();
  const [filterOpen, setFilterOpen] = useState(false);
  const [stopsFilter, setStopsFilter] = useState('all');

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

  const handleExportPdf = () => {
    exportOffersToPdf(filteredResults);
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>✈ Прайс-лист рейсов</h1>
          <p className={styles.subtitle}>Поиск по одной авиакомпании за диапазон дат</p>
        </header>

        <SearchForm onSearch={search} loading={loading} />

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
    </main>
  );
}
