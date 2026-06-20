'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { formatAirport, getAirportByCode, searchAirports } from '@/lib/airports';
import styles from './AirportSearch.module.scss';

export default function AirportSearch({ id, value, onChange, placeholder = 'Город или код аэропорта' }) {
  const listId = useId();
  const rootRef = useRef(null);
  const [query, setQuery] = useState(() => formatAirport(getAirportByCode(value)));
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const results = searchAirports(isOpen ? query : '');

  useEffect(() => {
    setQuery(formatAirport(getAirportByCode(value)));
  }, [value]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, query]);

  const selectAirport = (airport) => {
    onChange(airport.code);
    setQuery(formatAirport(airport));
    setIsOpen(false);
  };

  const closeDropdown = () => {
    setIsOpen(false);

    const trimmed = query.trim();
    const codeMatch = trimmed.match(/^([a-zA-Z]{3})\b/);
    const airportByCode = codeMatch ? getAirportByCode(codeMatch[1]) : null;

    if (airportByCode) {
      onChange(airportByCode.code);
      setQuery(formatAirport(airportByCode));
      return;
    }

    const matched = searchAirports(trimmed, 1)[0];
    if (matched && trimmed.length > 0) {
      onChange(matched.code);
      setQuery(formatAirport(matched));
      return;
    }

    setQuery(formatAirport(getAirportByCode(value)));
  };

  const handleKeyDown = (event) => {
    if (!isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % Math.max(results.length, 1));
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + Math.max(results.length, 1)) % Math.max(results.length, 1));
    }

    if (event.key === 'Enter' && isOpen && results[activeIndex]) {
      event.preventDefault();
      selectAirport(results[activeIndex]);
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
      setQuery(formatAirport(getAirportByCode(value)));
    }
  };

  const handleFocus = (event) => {
    setIsOpen(true);
    event.target.select();
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <input
        id={id}
        type="text"
        className={styles.input}
        value={query}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        onFocus={handleFocus}
        onClick={(event) => event.target.select()}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          window.setTimeout(closeDropdown, 120);
        }}
      />

      {isOpen && (
        <ul id={listId} className={styles.dropdown} role="listbox">
          {results.length === 0 ? (
            <li className={styles.empty}>Ничего не найдено</li>
          ) : (
            results.map((airport, index) => (
              <li key={airport.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`${styles.option} ${index === activeIndex ? styles.optionActive : ''}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectAirport(airport)}
                >
                  <span className={styles.code}>{airport.code}</span>
                  <span className={styles.name}>
                    {airport.location ? `${airport.name}, ${airport.location}` : airport.name}
                  </span>
                  <span className={styles.country}>{airport.country}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
