'use client';

import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import FlightCard from '@/components/FlightCard/FlightCard';
import { formatPrice } from '@/lib/utils';
import styles from './PriceTable.module.scss';

dayjs.locale('ru');

const COLLAPSE_ANIMATION_MS = 220;

export default function PriceTable({ results, sessionCookie = '' }) {
  const dates = Object.keys(results)
    .filter((date) => Array.isArray(results[date]) && results[date].length > 0)
    .sort();
  const [collapsedGroups, setCollapsedGroups] = useState({});

  if (dates.length === 0) return null;

  const toggleGroup = (groupKey) => {
    setCollapsedGroups((current) => ({
      ...current,
      [groupKey]: !current[groupKey],
    }));
  };

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
                {carrierGroups.map((group) => {
                  const groupKey = `${date}-${group.carrier_code}`;
                  const isCollapsed = Boolean(collapsedGroups[groupKey]);

                  return (
                    <div key={groupKey} className={styles.group}>
                      <button
                        className={styles.groupHeader}
                        type="button"
                        aria-expanded={!isCollapsed}
                        onClick={() => toggleGroup(groupKey)}
                      >
                        <h3 className={styles.groupTitle}>{group.carrier_name}</h3>
                        <span className={styles.groupMeta}>
                          <span className={styles.groupInfo}>
                            {group.items.length} предложени{group.items.length === 1 ? 'е' : group.items.length < 5 ? 'я' : 'й'} от{' '}
                            {formatPrice(group.items[0].price, group.items[0].currency)}
                          </span>
                          <span className={`${styles.toggleIcon} ${isCollapsed ? styles.toggleIconCollapsed : ''}`} aria-hidden="true">
                            ▾
                          </span>
                        </span>
                      </button>

                      <CollapsibleCards
                        isCollapsed={isCollapsed}
                        items={group.items}
                        date={date}
                        carrierCode={group.carrier_code}
                        sessionCookie={sessionCookie}
                      />
                    </div>
                  );
                })}
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

function CollapsibleCards({ isCollapsed, items, date, carrierCode, sessionCookie }) {
  const contentRef = useRef(null);
  const isInitialRender = useRef(true);
  const [isRendered, setIsRendered] = useState(!isCollapsed);
  const [height, setHeight] = useState(isCollapsed ? 0 : 'auto');

  useEffect(() => {
    if (!isCollapsed) {
      setIsRendered(true);
    }
  }, [isCollapsed]);

  useEffect(() => {
    if (!isRendered) return undefined;

    const content = contentRef.current;
    if (!content) return undefined;

    if (isInitialRender.current) {
      isInitialRender.current = false;
      setHeight(isCollapsed ? 0 : 'auto');
      return undefined;
    }

    let nextAnimationFrame;
    const animationFrame = requestAnimationFrame(() => {
      const nextHeight = content.scrollHeight;

      if (isCollapsed) {
        setHeight(nextHeight);
        nextAnimationFrame = requestAnimationFrame(() => setHeight(0));
        return;
      }

      setHeight(0);
      nextAnimationFrame = requestAnimationFrame(() => setHeight(nextHeight));
    });

    const timeout = window.setTimeout(() => {
      if (isCollapsed) {
        setIsRendered(false);
        return;
      }

      setHeight('auto');
    }, COLLAPSE_ANIMATION_MS);

    return () => {
      cancelAnimationFrame(animationFrame);
      cancelAnimationFrame(nextAnimationFrame);
      window.clearTimeout(timeout);
    };
  }, [isCollapsed, isRendered]);

  if (!isRendered) return null;

  return (
    <div
      className={`${styles.cardsWrap} ${isCollapsed ? styles.cardsWrapCollapsed : ''}`}
      style={{ height }}
      aria-hidden={isCollapsed}
    >
      <div ref={contentRef} className={styles.cards}>
        {items.map((flight, idx) => (
          <FlightCard key={`${date}-${carrierCode}-${idx}`} flight={flight} sessionCookie={sessionCookie} />
        ))}
      </div>
    </div>
  );
}
