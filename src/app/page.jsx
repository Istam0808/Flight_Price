'use client';
import SearchForm from '@/components/SearchForm/SearchForm';
import PriceTable from '@/components/PriceTable/PriceTable';
import Loader from '@/components/Loader/Loader';
import { useFlightSearch } from '@/hooks/useFlightSearch';
import { exportOffersToPdf } from '@/lib/pdf';
import styles from './page.module.scss';

export default function HomePage() {
  const { search, results, loading, progress, error } = useFlightSearch();

  const hasResults = Object.keys(results).length > 0;

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

        {!loading && hasResults && (
          <div className={styles.actions}>
            <button type="button" className={styles.exportButton} onClick={() => exportOffersToPdf(results)}>
              Экспортировать все предложения в PDF
            </button>
          </div>
        )}

        {!loading && hasResults && <PriceTable results={results} />}

        {!loading && !hasResults && !error && (
          <div className={styles.hint}>Выберите маршрут, дату и нажмите «Найти рейсы»</div>
        )}
      </div>
    </main>
  );
}
