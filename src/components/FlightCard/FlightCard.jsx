import { formatPrice, stopsLabel } from '@/lib/utils';
import styles from './FlightCard.module.scss';

export default function FlightCard({ flight }) {
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
  } = flight;

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
        <div className={styles.price}>{formatPrice(price, flight.currency)}</div>
      </div>
    </article>
  );
}
