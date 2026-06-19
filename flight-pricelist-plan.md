# План: Flight Price List — Next.js приложение

**Стек:** Next.js 14 (App Router) · JSX · SCSS Modules · src/ структура  
**Цель:** Прайс-лист авиабилетов по одной авиакомпании за диапазон дат через B2B API

---

## 1. Структура проекта

```
src/
├── app/
│   ├── layout.jsx
│   ├── page.jsx                    ← главная страница (форма поиска)
│   ├── globals.scss
│   └── api/
│       ├── search/
│       │   └── route.js            ← POST /api/search → B2B search
│       └── offers/
│           └── route.js            ← POST /api/offers → B2B polling
├── components/
│   ├── SearchForm/
│   │   ├── SearchForm.jsx
│   │   └── SearchForm.module.scss
│   ├── PriceTable/
│   │   ├── PriceTable.jsx
│   │   └── PriceTable.module.scss
│   ├── FlightCard/
│   │   ├── FlightCard.jsx
│   │   └── FlightCard.module.scss
│   └── Loader/
│       ├── Loader.jsx
│       └── Loader.module.scss
├── lib/
│   ├── api.js                      ← функции для работы с B2B API
│   ├── utils.js                    ← хелперы (форматирование цен, дат)
│   └── constants.js                ← список аэропортов, авиакомпаний
└── hooks/
    └── useFlightSearch.js          ← кастомный хук поиска
```

---

## 2. Установка и настройка

```bash
npx create-next-app@latest flight-pricelist \
  --js --src-dir --no-tailwind --no-typescript
cd flight-pricelist

# SCSS уже встроен в Next.js, просто переименовываем файлы
# и ставим дополнительные пакеты
npm install sass dayjs
```

**.env.local:**
```env
B2B_API_URL=https://b2b.prestigevoyage.uz/api/air
B2B_TOKEN=your_bearer_token_here
NEXT_PUBLIC_DEFAULT_CARRIER=HY
```

**next.config.js:**
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['b2b.prestigevoyage.uz'],
  },
};

module.exports = nextConfig;
```

---

## 3. Константы и утилиты

### `src/lib/constants.js`

```js
export const AIRPORTS = [
  { code: 'SKD', name: 'Самарканд', country: 'UZ' },
  { code: 'TAS', name: 'Ташкент',   country: 'UZ' },
  { code: 'IST', name: 'Стамбул',   country: 'TR' },
  { code: 'WAW', name: 'Варшава',   country: 'PL' },
  { code: 'SVO', name: 'Москва',    country: 'RU' },
  { code: 'FRA', name: 'Франкфурт', country: 'DE' },
  { code: 'DXB', name: 'Дубай',     country: 'AE' },
];

export const CARRIERS = {
  HY: 'Uzbekistan Airways',
  TK: 'Turkish Airlines',
  U6: 'Уральские авиалинии',
  C6: 'Centrum Air',
  S7: 'S7 Airlines',
};

export const DATE_RANGES = [
  { label: '+5 дней',  value: 5  },
  { label: '+10 дней', value: 10 },
  { label: '+15 дней', value: 15 },
];

export const FLIGHT_CLASSES = [
  { value: 'E', label: 'Эконом' },
  { value: 'B', label: 'Бизнес' },
];
```

### `src/lib/utils.js`

```js
import dayjs from 'dayjs';

// Форматируем цену: 6923589 → "69 235 сум" или "$XXX"
export function formatPrice(amount, currency = 'UZS') {
  if (currency === 'UZS') {
    return new Intl.NumberFormat('ru-RU').format(Math.round(amount / 100)) + ' сум';
  }
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Генерируем массив дат: '2026-06-30' + 5 дней = ['2026-06-30', ..., '2026-07-04']
export function generateDateRange(startDate, days) {
  return Array.from({ length: days }, (_, i) =>
    dayjs(startDate).add(i, 'day').format('YYYY-MM-DD')
  );
}

// Форматируем время в пути: 695 мин → "11 ч 35 мин"
export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
}

// Форматируем дату для отображения: '2026-06-30' → '30 июня'
export function formatDate(dateStr) {
  return dayjs(dateStr).format('D MMMM');
}

// Текст пересадок
export function stopsLabel(stops) {
  if (stops === 0) return 'Прямой';
  if (stops === 1) return '1 пересадка';
  return `${stops} пересадки`;
}
```

---

## 4. Библиотека работы с B2B API

### `src/lib/api.js`

```js
const BASE_URL = process.env.B2B_API_URL;
const TOKEN    = process.env.B2B_TOKEN;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`,
};

// ШАГ 1: Отправляем поисковый запрос, получаем request_id
export async function startSearch({ from, to, date, flightClass = 'E' }) {
  const res = await fetch(`${BASE_URL}/search`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      directions: [{
        departure_code: from,
        arrival_code:   to,
        date,
        time:       '',
        dir_number: 1,
      }],
      adult_qnt:  1,
      child_qnt:  0,
      infant_qnt: 0,
      class:      flightClass,
      direct:     false,
      flexible:   false,
      fare_types: ['PUB', 'NEG'],
    }),
  });

  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const data = await res.json();
  if (data.status !== 'ok') throw new Error(data.message || 'Search error');

  return data.request_id;
}

// ШАГ 2: Поллим /offers до тех пор пока status !== 'InProcess'
// Возвращает все накопленные офферы
export async function pollOffers(request_id, { onProgress } = {}) {
  let next_token = null;
  let allOffers  = [];
  let attempts   = 0;
  const MAX_ATTEMPTS = 30; // защита от бесконечного цикла

  while (attempts < MAX_ATTEMPTS) {
    attempts++;

    const body = {
      request_id,
      sort: 'price',
      ...(next_token && { next_token }),
    };

    const res = await fetch(`${BASE_URL}/offers`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Offers failed: ${res.status}`);
    const data = await res.json();

    // Накапливаем офферы из каждого чанка
    if (Array.isArray(data.offers) && data.offers.length > 0) {
      allOffers.push(...data.offers);
      onProgress?.(allOffers.length);
    }

    // Выходим из цикла когда поиск завершён
    if (data.status !== 'InProcess') break;

    next_token = data.next_token;
    await sleep(1200); // пауза между запросами
  }

  return allOffers;
}

// ШАГ 3: Фильтруем по нужной авиакомпании и нормализуем данные
export function filterAndNormalize(offers, carrierCode) {
  return offers
    .filter(o => o.carrier_code === carrierCode)
    .flatMap(o =>
      o.offers.map(offer => {
        const seg  = offer.segments[0];
        const legs = seg.flights_info;

        return {
          carrier_code:    o.carrier_code,
          carrier_name:    o.carrier_name,
          carrier_logo:    o.carrier_logo,
          price:           offer.min_price ?? seg.price,
          currency:        'UZS',
          date:            seg.departure_date,
          departure_time:  seg.departure_time,
          arrival_time:    seg.arrival_time,
          departure_airport: seg.departure_airport,
          arrival_airport:   seg.arrival_airport,
          duration_minutes:  seg.duration_minutes,
          duration_text:     seg.duration_formated,
          stops:             seg.stops,
          baggage:           seg.baggage,
          flight_numbers:    legs.map(l => l.flight_number_print).join(' + '),
          buy_id:            seg.buy_id,
          is_direct:         seg.stops === 0,
        };
      })
    )
    .sort((a, b) => a.price - b.price); // сортируем по цене
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
```

---

## 5. API Routes (серверная сторона)

### `src/app/api/search/route.js`

```js
import { NextResponse } from 'next/server';
import { startSearch } from '@/lib/api';

export async function POST(request) {
  try {
    const body = await request.json();
    const { from, to, date, flightClass } = body;

    if (!from || !to || !date) {
      return NextResponse.json(
        { error: 'Обязательные поля: from, to, date' },
        { status: 400 }
      );
    }

    const request_id = await startSearch({ from, to, date, flightClass });
    return NextResponse.json({ request_id });

  } catch (err) {
    console.error('[/api/search]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

### `src/app/api/offers/route.js`

```js
import { NextResponse } from 'next/server';
import { pollOffers, filterAndNormalize } from '@/lib/api';

export async function POST(request) {
  try {
    const { request_id, carrier_code } = await request.json();

    if (!request_id) {
      return NextResponse.json({ error: 'request_id обязателен' }, { status: 400 });
    }

    const carrier = carrier_code || process.env.NEXT_PUBLIC_DEFAULT_CARRIER || 'HY';
    const rawOffers = await pollOffers(request_id);
    const flights   = filterAndNormalize(rawOffers, carrier);

    return NextResponse.json({ flights, total: flights.length });

  } catch (err) {
    console.error('[/api/offers]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

---

## 6. Кастомный хук поиска

### `src/hooks/useFlightSearch.js`

```js
import { useState, useCallback } from 'react';
import { generateDateRange } from '@/lib/utils';

export function useFlightSearch() {
  const [results, setResults]   = useState({}); // { '2026-06-30': [...flights] }
  const [loading, setLoading]   = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError]       = useState(null);

  const search = useCallback(async ({ from, to, startDate, days, carrierCode, flightClass }) => {
    setLoading(true);
    setError(null);
    setResults({});

    const dates = generateDateRange(startDate, days);

    try {
      // Запускаем поиск по всем датам параллельно
      const searchPromises = dates.map(date =>
        fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from, to, date, flightClass }),
        }).then(r => r.json())
      );

      setProgress('Инициализация поиска...');
      const searchResults = await Promise.all(searchPromises);

      // Поллим офферы для каждой даты
      const offersPromises = searchResults.map(async ({ request_id }, idx) => {
        if (!request_id) return { date: dates[idx], flights: [] };

        setProgress(`Загружаем рейсы (${idx + 1}/${dates.length})...`);

        const res = await fetch('/api/offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ request_id, carrier_code: carrierCode }),
        });

        const data = await res.json();
        return { date: dates[idx], flights: data.flights || [] };
      });

      const allResults = await Promise.all(offersPromises);

      // Группируем по дате
      const grouped = {};
      allResults.forEach(({ date, flights }) => {
        grouped[date] = flights;
      });

      setResults(grouped);
      setProgress('');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { search, results, loading, progress, error };
}
```

---

## 7. Компоненты

### `src/components/SearchForm/SearchForm.jsx`

```jsx
'use client';
import { useState } from 'react';
import { AIRPORTS, CARRIERS, DATE_RANGES, FLIGHT_CLASSES } from '@/lib/constants';
import styles from './SearchForm.module.scss';

export default function SearchForm({ onSearch, loading }) {
  const [form, setForm] = useState({
    from:        'SKD',
    to:          'IST',
    startDate:   new Date().toISOString().split('T')[0],
    days:        5,
    carrierCode: 'HY',
    flightClass: 'E',
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(form);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.row}>
        <div className={styles.field}>
          <label>Откуда</label>
          <select value={form.from} onChange={e => set('from', e.target.value)}>
            {AIRPORTS.map(a => (
              <option key={a.code} value={a.code}>
                {a.code} — {a.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className={styles.swap}
          onClick={() => setForm(p => ({ ...p, from: p.to, to: p.from }))}
          aria-label="Поменять местами"
        >
          ⇄
        </button>

        <div className={styles.field}>
          <label>Куда</label>
          <select value={form.to} onChange={e => set('to', e.target.value)}>
            {AIRPORTS.map(a => (
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
            onChange={e => set('startDate', e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label>Диапазон</label>
          <div className={styles.radioGroup}>
            {DATE_RANGES.map(r => (
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
          <select value={form.carrierCode} onChange={e => set('carrierCode', e.target.value)}>
            {Object.entries(CARRIERS).map(([code, name]) => (
              <option key={code} value={code}>{code} — {name}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label>Класс</label>
          <select value={form.flightClass} onChange={e => set('flightClass', e.target.value)}>
            {FLIGHT_CLASSES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
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
```

### `src/components/SearchForm/SearchForm.module.scss`

```scss
.form {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.row {
  display: flex;
  gap: 16px;
  align-items: flex-end;

  @media (max-width: 600px) {
    flex-direction: column;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;

  label {
    font-size: 13px;
    font-weight: 500;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  select,
  input[type='date'] {
    padding: 10px 12px;
    border: 1.5px solid #e0e0e0;
    border-radius: 8px;
    font-size: 15px;
    color: #222;
    background: #fafafa;
    transition: border-color 0.2s;
    width: 100%;

    &:focus {
      outline: none;
      border-color: #3b6ef5;
      background: #fff;
    }
  }
}

.swap {
  padding: 10px 14px;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  background: #f5f5f5;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
  margin-bottom: 0;

  &:hover {
    background: #e8e8e8;
  }
}

.radioGroup {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.radio {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
  padding: 8px 14px;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  transition: border-color 0.2s, background 0.2s;

  &:has(input:checked) {
    border-color: #3b6ef5;
    background: #eef1ff;
    color: #3b6ef5;
    font-weight: 500;
  }

  input {
    display: none;
  }
}

.submit {
  padding: 14px;
  background: #3b6ef5;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;

  &:hover:not(:disabled) {
    background: #2d5be0;
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
```

---

### `src/components/FlightCard/FlightCard.jsx`

```jsx
import { formatPrice, formatDuration, stopsLabel } from '@/lib/utils';
import styles from './FlightCard.module.scss';

export default function FlightCard({ flight }) {
  const {
    flight_numbers,
    departure_time,
    arrival_time,
    departure_airport,
    arrival_airport,
    duration_text,
    stops,
    baggage,
    price,
    is_direct,
    carrier_logo,
  } = flight;

  return (
    <div className={`${styles.card} ${is_direct ? styles.direct : ''}`}>
      <div className={styles.airline}>
        {carrier_logo && (
          <img src={carrier_logo} alt="" width={28} height={28} />
        )}
        <span className={styles.flightNum}>{flight_numbers}</span>
      </div>

      <div className={styles.route}>
        <div className={styles.time}>
          <span className={styles.timeMain}>{departure_time?.slice(0, 5)}</span>
          <span className={styles.airport}>{departure_airport}</span>
        </div>

        <div className={styles.middle}>
          <span className={styles.duration}>{duration_text}</span>
          <div className={styles.line}>
            <div className={styles.dot} />
            <div className={styles.dash} />
            <div className={styles.dot} />
          </div>
          <span className={`${styles.stops} ${is_direct ? styles.stopsGreen : styles.stopsOrange}`}>
            {stopsLabel(stops)}
          </span>
        </div>

        <div className={styles.time}>
          <span className={styles.timeMain}>{arrival_time?.slice(0, 5)}</span>
          <span className={styles.airport}>{arrival_airport}</span>
        </div>
      </div>

      <div className={styles.info}>
        <span className={styles.baggage}>🧳 {baggage || 'н/д'}</span>
      </div>

      <div className={styles.price}>
        {formatPrice(price)}
      </div>
    </div>
  );
}
```

### `src/components/FlightCard/FlightCard.module.scss`

```scss
.card {
  display: grid;
  grid-template-columns: 100px 1fr auto auto;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  border-radius: 10px;
  border: 1.5px solid #ebebeb;
  background: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:hover {
    border-color: #3b6ef5;
    box-shadow: 0 2px 10px rgba(59, 110, 245, 0.1);
  }

  &.direct {
    border-left: 3px solid #22c55e;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
  }
}

.airline {
  display: flex;
  align-items: center;
  gap: 8px;

  img {
    border-radius: 4px;
    object-fit: contain;
  }
}

.flightNum {
  font-size: 13px;
  font-weight: 600;
  color: #444;
}

.route {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.timeMain {
  font-size: 18px;
  font-weight: 700;
  color: #111;
  line-height: 1;
}

.airport {
  font-size: 12px;
  color: #888;
  font-weight: 500;
}

.middle {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.duration {
  font-size: 12px;
  color: #666;
}

.line {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 0;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #bbb;
  flex-shrink: 0;
}

.dash {
  flex: 1;
  height: 1.5px;
  background: #ddd;
}

.stops {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.stopsGreen  { color: #22c55e; }
.stopsOrange { color: #f59e0b; }

.info {
  font-size: 13px;
  color: #666;
}

.baggage {
  white-space: nowrap;
}

.price {
  font-size: 17px;
  font-weight: 700;
  color: #3b6ef5;
  white-space: nowrap;
  text-align: right;
}
```

---

### `src/components/PriceTable/PriceTable.jsx`

```jsx
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import FlightCard from '@/components/FlightCard/FlightCard';
import styles from './PriceTable.module.scss';

dayjs.locale('ru');

export default function PriceTable({ results }) {
  const dates = Object.keys(results).sort();

  if (dates.length === 0) return null;

  return (
    <div className={styles.table}>
      {dates.map(date => {
        const flights = results[date];
        const weekday = dayjs(date).format('dddd, D MMMM');

        return (
          <section key={date} className={styles.dateSection}>
            <div className={styles.dateHeader}>
              <h2 className={styles.dateTitle}>{weekday}</h2>
              <span className={styles.count}>
                {flights.length > 0
                  ? `${flights.length} рейс${flights.length === 1 ? '' : 'а'}`
                  : 'Рейсов нет'
                }
              </span>
            </div>

            {flights.length > 0 ? (
              <div className={styles.cards}>
                {flights.map((flight, idx) => (
                  <FlightCard key={`${date}-${idx}`} flight={flight} />
                ))}
              </div>
            ) : (
              <p className={styles.empty}>
                На эту дату рейсов выбранной авиакомпании не найдено
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
```

### `src/components/PriceTable/PriceTable.module.scss`

```scss
.table {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.dateSection {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dateHeader {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1.5px solid #f0f0f0;
}

.dateTitle {
  font-size: 17px;
  font-weight: 600;
  color: #222;
  text-transform: capitalize;
  margin: 0;
}

.count {
  font-size: 13px;
  color: #999;
}

.cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty {
  font-size: 14px;
  color: #aaa;
  padding: 16px 0;
  font-style: italic;
}
```

---

### `src/components/Loader/Loader.jsx`

```jsx
import styles from './Loader.module.scss';

export default function Loader({ message = 'Загрузка...' }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.spinner} />
      <p className={styles.message}>{message}</p>
    </div>
  );
}
```

### `src/components/Loader/Loader.module.scss`

```scss
.wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top-color: #3b6ef5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.message {
  font-size: 14px;
  color: #888;
}
```

---

## 8. Главная страница

### `src/app/page.jsx`

```jsx
'use client';
import SearchForm from '@/components/SearchForm/SearchForm';
import PriceTable from '@/components/PriceTable/PriceTable';
import Loader from '@/components/Loader/Loader';
import { useFlightSearch } from '@/hooks/useFlightSearch';
import styles from './page.module.scss';

export default function HomePage() {
  const { search, results, loading, progress, error } = useFlightSearch();

  const hasResults = Object.keys(results).length > 0;

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>✈ Прайс-лист рейсов</h1>
          <p className={styles.subtitle}>
            Поиск по одной авиакомпании за диапазон дат
          </p>
        </header>

        <SearchForm onSearch={search} loading={loading} />

        {loading && <Loader message={progress || 'Поиск рейсов...'} />}

        {error && (
          <div className={styles.error}>
            <strong>Ошибка:</strong> {error}
          </div>
        )}

        {!loading && hasResults && (
          <PriceTable results={results} />
        )}

        {!loading && !hasResults && !error && (
          <div className={styles.hint}>
            Выберите маршрут, дату и нажмите «Найти рейсы»
          </div>
        )}
      </div>
    </main>
  );
}
```

### `src/app/page.module.scss`

```scss
.main {
  min-height: 100vh;
  background: #f6f8ff;
  padding: 40px 16px 80px;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.header {
  text-align: center;
}

.title {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 8px;
}

.subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.error {
  padding: 14px 18px;
  background: #fef2f2;
  border: 1.5px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
}

.hint {
  text-align: center;
  padding: 48px 0;
  font-size: 15px;
  color: #bbb;
}
```

### `src/app/globals.scss`

```scss
*, *::before, *::after {
  box-sizing: border-box;
}

html {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

body {
  margin: 0;
  padding: 0;
  color: #222;
}

h1, h2, h3 {
  margin: 0;
}

button {
  font-family: inherit;
}
```

### `src/app/layout.jsx`

```jsx
import './globals.scss';

export const metadata = {
  title: 'Flight Price List',
  description: 'Прайс-лист авиабилетов по выбранной авиакомпании',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
```

---

## 9. Итоговый поток данных

```
Пользователь заполняет форму
        ↓
useFlightSearch.search()
        ↓
Параллельно по N дат:
  POST /api/search → { request_id }
        ↓
  POST /api/offers → polling B2B
        ↓
  filterAndNormalize() → только нужная авиакомпания
        ↓
setResults({ '2026-06-30': [...], '2026-07-01': [...], ... })
        ↓
PriceTable рендерит по датам → FlightCard на каждый рейс
```

---

## 10. Запуск проекта

```bash
# Разработка
npm run dev

# Продакшен
npm run build
npm start
```

Приложение поднимется на `http://localhost:3000`

---

## 11. Возможные улучшения

- **Экспорт в Excel** — `xlsx` пакет, кнопка "Скачать прайс"
- **Кэширование** — сохранять результаты в `localStorage` по ключу `from-to-date`
- **Telegram уведомления** — бот присылает прайс по расписанию (cron)
- **Сравнение авиакомпаний** — показывать несколько carriers одновременно
- **Авторизация** — если B2B API требует логин на фронте
- **Валюта** — переключатель UZS / USD / EUR через `available_currencies`
