import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import FlightCard from '@/components/FlightCard/FlightCard';
import { formatPrice } from '@/lib/utils';
import styles from './PriceTable.module.scss';

dayjs.locale('ru');

export default function PriceTable({ results, sessionCookie = '' }) {
  const dates = Object.keys(results).sort();

  if (dates.length === 0) return null;

  return (
    <div className={styles.table}>
      {dates.map((date) => {
        const flights = results[date];
        const weekday = dayjs(date).format('dddd, D MMMM');
        const groupedByCarrier = flights.reduce((acc, flight) => {
          const key = `${flight.carrier_code}-${flight.carrier_name}`;
          if (!acc[key]) {
            acc[key] = {
              carrier_code: flight.carrier_code,
              carrier_name: flight.carrier_name,
              items: [],
            };
          }

          acc[key].items.push(flight);
          return acc;
        }, {});

        const carrierGroups = Object.values(groupedByCarrier)
          .map((group) => ({
            ...group,
            items: group.items.sort((a, b) => a.price - b.price),
          }))
          .sort((a, b) => a.items[0].price - b.items[0].price);

        return (
          <section key={date} className={styles.dateSection}>
            <div className={styles.dateHeader}>
              <h2 className={styles.dateTitle}>{weekday}</h2>
              <span className={styles.count}>
                {flights.length > 0 ? `${flights.length} рейс${flights.length === 1 ? '' : 'а'}` : 'Рейсов нет'}
              </span>
            </div>

            {carrierGroups.length > 0 ? (
              <div className={styles.groups}>
                {carrierGroups.map((group) => (
                  <div key={`${date}-${group.carrier_code}`} className={styles.group}>
                    <div className={styles.groupHeader}>
                      <h3 className={styles.groupTitle}>{group.carrier_name}</h3>
                      <span className={styles.groupInfo}>
                        {group.items.length} предложени{group.items.length === 1 ? 'е' : group.items.length < 5 ? 'я' : 'й'} от{' '}
                        {formatPrice(group.items[0].price, group.items[0].currency)}
                      </span>
                    </div>

                    <div className={styles.cards}>
                      {group.items.map((flight, idx) => (
                        <FlightCard
                          key={`${date}-${group.carrier_code}-${idx}`}
                          flight={flight}
                          sessionCookie={sessionCookie}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.empty}>На эту дату рейсов не найдено</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
