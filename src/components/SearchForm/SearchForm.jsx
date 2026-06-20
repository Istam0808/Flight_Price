'use client';
import { useState } from 'react';
import AirportSearch from '@/components/AirportSearch/AirportSearch';
import { DATE_RANGE } from '@/lib/constants';
import styles from './SearchForm.module.scss';

function formatDaysLabel(days) {
  const mod10 = days % 10;
  const mod100 = days % 100;

  if (mod10 === 1 && mod100 !== 11) return `${days} день`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${days} дня`;
  return `${days} дней`;
}

export default function SearchForm({ onSearch, loading }) {
  const [form, setForm] = useState({
    from: 'TAS',
    to: 'DXB',
    startDate: new Date().toISOString().split('T')[0],
    days: DATE_RANGE.default,
  });

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(form);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="search-from">Откуда</label>
          <AirportSearch
            id="search-from"
            value={form.from}
            onChange={(code) => set('from', code)}
            placeholder="Например: TAS, Москва, MOW"
          />
        </div>

        <button
          type="button"
          className={styles.swap}
          onClick={() => setForm((p) => ({ ...p, from: p.to, to: p.from }))}
          aria-label="Поменять местами"
        >
          ⇄
        </button>

        <div className={styles.field}>
          <label htmlFor="search-to">Куда</label>
          <AirportSearch
            id="search-to"
            value={form.to}
            onChange={(code) => set('to', code)}
            placeholder="Например: DXB, MOW, Стамбул"
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label>Дата вылета</label>
          <input
            type="date"
            value={form.startDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => set('startDate', e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <div className={styles.rangeHeader}>
            <label htmlFor="search-days">Диапазон</label>
            <span className={styles.rangeValue}>+{formatDaysLabel(form.days)}</span>
          </div>
          <input
            id="search-days"
            type="range"
            className={styles.range}
            min={DATE_RANGE.min}
            max={DATE_RANGE.max}
            step={1}
            value={form.days}
            style={{
              '--range-progress': `${((form.days - DATE_RANGE.min) / (DATE_RANGE.max - DATE_RANGE.min)) * 100}%`,
            }}
            onChange={(e) => set('days', Number(e.target.value))}
          />
          <div className={styles.rangeMarks}>
            <span>{DATE_RANGE.min}</span>
            <span>{DATE_RANGE.max}</span>
          </div>
        </div>
      </div>

      <button type="submit" className={styles.submit} disabled={loading}>
        {loading ? 'Поиск...' : 'Найти рейсы'}
      </button>
    </form>
  );
}
