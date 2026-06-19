'use client';
import { useState } from 'react';
import { AIRPORTS, CARRIERS, DATE_RANGES } from '@/lib/constants';
import styles from './SearchForm.module.scss';

export default function SearchForm({ onSearch, loading }) {
  const [form, setForm] = useState({
    from: 'TAS',
    to: 'DXB',
    startDate: new Date().toISOString().split('T')[0],
    days: 5,
    carrierCode: 'C6',
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
          <label>Откуда</label>
          <select value={form.from} onChange={(e) => set('from', e.target.value)}>
            {AIRPORTS.map((a) => (
              <option key={a.code} value={a.code}>
                {a.code} — {a.name}
              </option>
            ))}
          </select>
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
          <label>Куда</label>
          <select value={form.to} onChange={(e) => set('to', e.target.value)}>
            {AIRPORTS.map((a) => (
              <option key={a.code} value={a.code}>
                {a.code} — {a.name}
              </option>
            ))}
          </select>
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
          <label>Диапазон</label>
          <div className={styles.radioGroup}>
            {DATE_RANGES.map((r) => (
              <label key={r.value} className={styles.radio}>
                <input
                  type="radio"
                  name="days"
                  value={r.value}
                  checked={form.days === r.value}
                  onChange={() => set('days', r.value)}
                />
                {r.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label>Авиакомпания</label>
          <select value={form.carrierCode} onChange={(e) => set('carrierCode', e.target.value)}>
            {Object.entries(CARRIERS).map(([code, name]) => (
              <option key={code} value={code}>
                {code} — {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button type="submit" className={styles.submit} disabled={loading}>
        {loading ? 'Поиск...' : 'Найти рейсы'}
      </button>
    </form>
  );
}
