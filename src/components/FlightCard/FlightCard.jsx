'use client';

import { useState } from 'react';
import { formatPrice, stopsLabel } from '@/lib/utils';
import styles from './FlightCard.module.scss';

const isProduction = process.env.NODE_ENV === 'production';
const B2B_SESSION_EXPIRED_CODE = 'b2b-session-expired';

function setLoadingTab(newTab) {
  if (!newTab) return;

  try {
    newTab.document.title = 'Загрузка...';
    newTab.document.body.innerHTML =
      '<p style="font-family:sans-serif;padding:24px">Подготовка оформления заказа...</p>';
  } catch {
    // ignore if document access is restricted
  }
}

export default function FlightCard({ flight, sessionCookie = '' }) {
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState('');

  const {
    carrier_name,
    flight_numbers,
    departure_time,
    arrival_time,
    date,
    departure_airport,
    arrival_airport,
    duration_text,
    stops,
    baggage,
    tariff,
    pcc_name,
    fare_label,
    price,
    request_id,
    buy_id,
  } = flight;

  const executeBuy = async () => {
    if (!request_id || !buy_id || buying) return;

    setConfirmOpen(false);
    setBuyError('');
    setFallbackUrl('');

    const newTab = window.open('about:blank', '_blank');
    setLoadingTab(newTab);

    setBuying(true);

    try {
      const res = await fetch('/api/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionCookie && { 'x-b2b-session-cookie': sessionCookie }),
        },
        body: JSON.stringify({ request_id, buy_id }),
      });

      const data = await res.json();

      if (res.status === 403 && data.code === B2B_SESSION_EXPIRED_CODE) {
        newTab?.close();
        window.location.assign('/b2b-login?next=/');
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Не удалось оформить покупку');
      }

      if (newTab) {
        newTab.location.href = data.orderUrl;
        return;
      }

      setFallbackUrl(data.orderUrl);
    } catch (err) {
      newTab?.close();
      setBuyError(err.message);
    } finally {
      setBuying(false);
    }
  };

  const handleBuyClick = () => {
    if (!request_id || !buy_id || buying) return;

    if (isProduction) {
      setConfirmOpen(true);
      return;
    }

    executeBuy();
  };

  const closeFallback = () => {
    setFallbackUrl('');
  };

  return (
    <>
      <article className={styles.row}>
        <div className={styles.flightCell}>
          <div className={styles.flightNumber}>{flight_numbers}</div>
          <div className={styles.carrier}>{carrier_name}</div>
        </div>

        <div className={styles.routeCell}>
          <div className={styles.point}>
            <div className={styles.time}>{departure_time?.slice(0, 5)}</div>
            <div className={styles.meta}>
              {departure_airport} {date?.slice(8, 10)}.{date?.slice(5, 7)}
            </div>
          </div>

          <div className={styles.middle}>
            <div className={styles.duration}>{duration_text}</div>
            <div className={styles.stops}>{stopsLabel(stops)}</div>
          </div>

          <div className={styles.point}>
            <div className={styles.time}>{arrival_time?.slice(0, 5)}</div>
            <div className={styles.meta}>
              {arrival_airport} {date?.slice(8, 10)}.{date?.slice(5, 7)}
            </div>
          </div>
        </div>

        <div className={styles.fareCell}>
          <div className={styles.tariff}>{tariff || 'Тариф не указан'}</div>
          <div className={styles.baggage}>{baggage || '0KG'}</div>
        </div>

        <div className={styles.vendorCell}>
          <span className={styles.vendor}>{fare_label || pcc_name || 'GDS'}</span>
        </div>

        <div className={styles.priceCell}>
          <div className={styles.priceBlock}>
            <div className={styles.price}>{formatPrice(price, flight.currency)}</div>
            {request_id && buy_id && (
              <button
                type="button"
                onClick={handleBuyClick}
                disabled={buying}
                className={styles.buyBtn}
              >
                {buying ? 'Проверка...' : 'Купить'}
              </button>
            )}
            {buyError && <div className={styles.buyError}>{buyError}</div>}
          </div>
        </div>
      </article>

      {confirmOpen && (
        <div className={styles.buyModalOverlay} onClick={() => setConfirmOpen(false)}>
          <div className={styles.buyModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.buyModalTitle}>Открыть оформление на B2B</h3>
            <p className={styles.buyModalText}>
              Сейчас откроется новая вкладка для оформления билета.
            </p>
            <p className={styles.buyModalHint}>
              Если браузер спросит разрешение на всплывающие окна — нажмите «Разрешить».
            </p>
            <div className={styles.buyModalActions}>
              <button type="button" className={styles.buyModalPrimary} onClick={executeBuy}>
                Открыть B2B
              </button>
              <button type="button" className={styles.buyModalSecondary} onClick={() => setConfirmOpen(false)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {fallbackUrl && (
        <div className={styles.buyModalOverlay} onClick={closeFallback}>
          <div className={styles.buyModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.buyModalTitle}>Разрешите всплывающие окна</h3>
            <p className={styles.buyModalText}>
              Браузер заблокировал автоматическое открытие вкладки. Нажмите кнопку ниже — откроется
              оформление на B2B.
            </p>
            <p className={styles.buyModalHint}>
              Чтобы вкладка открывалась автоматически, разрешите всплывающие окна для этого сайта в
              настройках браузера.
            </p>
            <div className={styles.buyModalActions}>
              <a
                href={fallbackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.buyModalPrimary}
                onClick={closeFallback}
              >
                Перейти на B2B
              </a>
              <button type="button" className={styles.buyModalSecondary} onClick={closeFallback}>
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
