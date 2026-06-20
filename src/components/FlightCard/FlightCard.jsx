'use client';

import { useState } from 'react';
import { formatPrice, stopsLabel } from '@/lib/utils';
import styles from './FlightCard.module.scss';

export default function FlightCard({ flight, sessionCookie = '' }) {
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState('');

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

  const handleBuy = async () => {
    if (!request_id || !buy_id || buying) return;

    const newTab = window.open('about:blank', '_blank');

    if (!newTab) {
      setBuyError('Браузер заблокировал новую вкладку. Разрешите всплывающие окна для сайта.');
      return;
    }

    try {
      newTab.document.title = 'Загрузка...';
      newTab.document.body.innerHTML = '<p style="font-family:sans-serif;padding:24px">Подготовка оформления заказа...</p>';
    } catch {
      // ignore if document access is restricted
    }

    setBuying(true);
    setBuyError('');

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

      if (!res.ok) {
        throw new Error(data.error || 'Не удалось оформить покупку');
      }

      newTab.location.href = data.orderUrl;
    } catch (err) {
      newTab.close();
      setBuyError(err.message);
    } finally {
      setBuying(false);
    }
  };

  return (
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
              onClick={handleBuy}
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
  );
}
