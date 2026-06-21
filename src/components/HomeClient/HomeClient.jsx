'use client';
import { useEffect, useMemo, useState } from 'react';
import SearchForm from '@/components/SearchForm/SearchForm';
import PriceTable from '@/components/PriceTable/PriceTable';
import PriceRangeFilter from '@/components/PriceRangeFilter/PriceRangeFilter';
import Loader from '@/components/Loader/Loader';
import ContactInfo from '@/components/ContactInfo/ContactInfo';
import { useAuth } from '@/hooks/useAuth';
import { useFlightSearch } from '@/hooks/useFlightSearch';
import { exportOffersToPdf } from '@/lib/pdf';
import { formatOffersForTelegram } from '@/lib/telegram';
import styles from '@/app/page.module.scss';

const STOPS_FILTERS = [
  { value: 'all', label: 'Все рейсы' },
  { value: '0', label: 'Только прямые' },
  { value: '1', label: '1 пересадка' },
  { value: '2', label: '2 пересадки' },
];
const COOKIE_STORAGE_KEY = 'b2b_session_cookie';

function filterByStopsAndCarrier(flights, stopsFilter, carrierFilter) {
  let filtered = flights || [];

  if (stopsFilter !== 'all') {
    const filterValue = Number(stopsFilter);
    filtered = filtered.filter((flight) => (flight.stops ?? 0) === filterValue);
  }

  if (carrierFilter !== 'all') {
    filtered = filtered.filter((flight) => flight.carrier_code === carrierFilter);
  }

  return filtered;
}

export default function HomeClient({ appUser }) {
  const { search, results, loading, progress, error } = useFlightSearch();
  const { logout: logoutApp, loading: appAuthLoading } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [stopsFilter, setStopsFilter] = useState('all');
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [carrierFilterOpen, setCarrierFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState(null);
  const [cookieValue, setCookieValue] = useState('');
  const [cookieStatus, setCookieStatus] = useState('');
  const [lastSearch, setLastSearch] = useState(null);
  const [copyStatus, setCopyStatus] = useState('');
  const [authStatus, setAuthStatus] = useState('checking');
  const [authMessage, setAuthMessage] = useState('');

  useEffect(() => {
    const savedCookie = localStorage.getItem(COOKIE_STORAGE_KEY) || '';
    setCookieValue(savedCookie);
    refreshAuthStatus();
  }, []);

  const availableCarriers = useMemo(() => {
    const carriers = new Map();

    Object.values(results).forEach((flights) => {
      (flights || []).forEach((flight) => {
        if (!carriers.has(flight.carrier_code)) {
          carriers.set(flight.carrier_code, flight.carrier_name);
        }
      });
    });

    return Array.from(carriers.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }, [results]);

  const resultsBeforePrice = useMemo(() => {
    const next = {};

    Object.entries(results).forEach(([date, flights]) => {
      next[date] = filterByStopsAndCarrier(flights, stopsFilter, carrierFilter);
    });

    return next;
  }, [results, stopsFilter, carrierFilter]);

  const priceBounds = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    Object.values(resultsBeforePrice).forEach((flights) => {
      (flights || []).forEach((flight) => {
        if (flight.price < min) min = flight.price;
        if (flight.price > max) max = flight.price;
      });
    });

    if (!Number.isFinite(min)) {
      return { min: 0, max: 0 };
    }

    return { min, max };
  }, [resultsBeforePrice]);

  useEffect(() => {
    if (priceBounds.max <= 0) {
      setPriceRange(null);
      return;
    }

    setPriceRange({ min: priceBounds.min, max: priceBounds.max });
  }, [priceBounds]);

  const filteredResults = useMemo(() => {
    const next = {};

    Object.entries(resultsBeforePrice).forEach(([date, flights]) => {
      let filtered = flights || [];

      if (priceRange) {
        filtered = filtered.filter(
          (flight) => flight.price >= priceRange.min && flight.price <= priceRange.max,
        );
      }

      next[date] = filtered;
    });

    return next;
  }, [resultsBeforePrice, priceRange]);

  const hasRawResults = Object.keys(results).length > 0;
  const filteredFlightsCount = Object.values(filteredResults).reduce((sum, flights) => sum + flights.length, 0);
  const hasFilteredResults = filteredFlightsCount > 0;
  const selectedFilterLabel = STOPS_FILTERS.find((item) => item.value === stopsFilter)?.label || 'Все рейсы';
  const selectedCarrierLabel =
    carrierFilter === 'all'
      ? 'Все авиакомпании'
      : availableCarriers.find((item) => item.code === carrierFilter)?.name || carrierFilter;

  const handleExportPdf = async () => {
    await exportOffersToPdf(filteredResults, lastSearch || {});
  };

  const handleCopyTg = async () => {
    try {
      const text = formatOffersForTelegram(filteredResults, lastSearch || {});
      await navigator.clipboard.writeText(text);
      setCopyStatus('Скопировано!');
    } catch {
      setCopyStatus('Ошибка копирования');
    }

    window.setTimeout(() => setCopyStatus(''), 2000);
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

  const refreshAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status');
      const data = await response.json();

      setAuthStatus(data.authenticated ? 'authenticated' : 'anonymous');
    } catch {
      setAuthStatus('unknown');
    }
  };

  const handleLogout = async () => {
    setAuthMessage('');

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setAuthStatus('anonymous');
      setAuthMessage('Вы вышли из B2B');
    } catch {
      setAuthMessage('Не удалось выйти из B2B');
    }
  };

  const handleAppLogout = async () => {
    await logoutApp().catch(() => {});
  };

  const handleSearch = (form) => {
    setStopsFilter('all');
    setCarrierFilter('all');
    setPriceRange(null);
    setLastSearch({ from: form.from, to: form.to, startDate: form.startDate });
    search({ ...form, sessionCookie: cookieValue.trim() });
  };

  const handlePriceReset = () => {
    setPriceRange({ min: priceBounds.min, max: priceBounds.max });
  };

  const closeSettings = () => {
    setSettingsOpen(false);
    setCookieStatus('');
  };

  const closeContacts = () => {
    setContactsOpen(false);
  };

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerBrand}>
            <img src="/img/logo.png" alt="Luminara Voyage" className={styles.brandLogo} />
            <p className={styles.brandSubtitle}>Прайс-лист рейсов</p>
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.contactButton} onClick={() => setContactsOpen(true)}>
              Контакты
            </button>
            <button type="button" className={styles.settingsButton} onClick={() => setSettingsOpen(true)}>
              Настройки
            </button>
          </div>
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

        {!loading && !hasRawResults && !error && (
          <div className={styles.hint}>Выберите маршрут, дату и нажмите «Найти рейсы»</div>
        )}
      </div>

      {!loading && hasRawResults && (
        <div className={styles.resultsShell}>
          {priceBounds.max > 0 && priceRange && (
            <aside className={styles.priceSidebar}>
              <div className={styles.priceFilterPanel}>
                <PriceRangeFilter
                  boundsMin={priceBounds.min}
                  boundsMax={priceBounds.max}
                  valueMin={priceRange.min}
                  valueMax={priceRange.max}
                  onChange={({ min, max }) => setPriceRange({ min, max })}
                  onReset={handlePriceReset}
                />
              </div>
            </aside>
          )}

          <div className={styles.mainContent}>
            <div className={styles.actions}>
              <div className={styles.filters}>
                <div className={styles.filterWrap}>
                  <button type="button" className={styles.filterButton} onClick={() => setFilterOpen((prev) => !prev)}>
                    Пересадки: {selectedFilterLabel}
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

                {availableCarriers.length > 0 && (
                  <div className={styles.filterWrap}>
                    <button
                      type="button"
                      className={styles.filterButton}
                      onClick={() => setCarrierFilterOpen((prev) => !prev)}
                    >
                      Авиакомпания: {selectedCarrierLabel}
                    </button>

                    {carrierFilterOpen && (
                      <div className={styles.filterMenu}>
                        <button
                          type="button"
                          className={`${styles.filterItem} ${carrierFilter === 'all' ? styles.filterItemActive : ''}`}
                          onClick={() => {
                            setCarrierFilter('all');
                            setCarrierFilterOpen(false);
                          }}
                        >
                          Все авиакомпании
                        </button>
                        {availableCarriers.map((item) => (
                          <button
                            key={item.code}
                            type="button"
                            className={`${styles.filterItem} ${carrierFilter === item.code ? styles.filterItemActive : ''}`}
                            onClick={() => {
                              setCarrierFilter(item.code);
                              setCarrierFilterOpen(false);
                            }}
                          >
                            {item.code} — {item.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.exportActions}>
                <button type="button" className={styles.copyTgButton} onClick={handleCopyTg} disabled={!hasFilteredResults}>
                  {copyStatus || 'Copy TG'}
                </button>
                <button type="button" className={styles.exportButton} onClick={handleExportPdf} disabled={!hasFilteredResults}>
                  Экспорт PDF ({filteredFlightsCount})
                </button>
              </div>
            </div>

            {hasFilteredResults && (
              <PriceTable results={filteredResults} sessionCookie={cookieValue.trim()} />
            )}

            {!hasFilteredResults && (
              <div className={styles.hint}>По выбранному фильтру рейсов не найдено</div>
            )}
          </div>
        </div>
      )}

      {contactsOpen && (
        <div className={styles.modalOverlay} onClick={closeContacts}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.modalClose} onClick={closeContacts} aria-label="Закрыть контакты">
              ×
            </button>
            <section className={styles.contactCard}>
              <ContactInfo />
            </section>
          </div>
        </div>
      )}

      {settingsOpen && (
        <div className={styles.modalOverlay} onClick={closeSettings}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.modalClose} onClick={closeSettings} aria-label="Закрыть настройки">
              ×
            </button>
            <section className={styles.authCard}>
              <div className={styles.cookieHeader}>
                <h2 className={styles.cookieTitle}>Вход в систему</h2>
                <span className={styles.cookieHint}>{appUser?.email || 'Firebase'}</span>
              </div>
              <p className={styles.authText}>
                Эта сессия защищает доступ к приложению. Второй вход с тем же аккаунтом будет отклонён до выхода или истечения сессии.
              </p>
              <div className={styles.authActions}>
                <button type="button" className={styles.cookieClear} onClick={handleAppLogout} disabled={appAuthLoading}>
                  {appAuthLoading ? 'Выходим...' : 'Выйти из системы'}
                </button>
              </div>
            </section>
            <section className={styles.authCard}>
              <div className={styles.cookieHeader}>
                <h2 className={styles.cookieTitle}>B2B Login</h2>
                <span className={styles.cookieHint}>
                  {authStatus === 'authenticated' && 'Вход выполнен'}
                  {authStatus === 'anonymous' && 'Вход не выполнен'}
                  {authStatus === 'checking' && 'Проверяем...'}
                  {authStatus === 'unknown' && 'Статус неизвестен'}
                </span>
              </div>
              <p className={styles.authText}>
                После входа cookie token будет подставляться в поиск и оформление автоматически.
              </p>
              <div className={styles.authActions}>
                <a className={styles.loginLink} href="/b2b-login">
                  Войти в B2B
                </a>
                {authStatus === 'authenticated' && (
                  <button type="button" className={styles.cookieClear} onClick={handleLogout}>
                    Выйти
                  </button>
                )}
              </div>
              {authMessage && <span className={styles.cookieStatus}>{authMessage}</span>}
            </section>
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
