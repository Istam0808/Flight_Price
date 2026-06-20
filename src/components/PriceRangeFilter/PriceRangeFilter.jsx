'use client';

import { useEffect, useState } from 'react';
import styles from './PriceRangeFilter.module.scss';

function formatPrice(value) {
  return Math.round(value).toLocaleString('ru-RU');
}

function getTooltipAlign(percent) {
  if (percent <= 8) return 'start';
  if (percent >= 92) return 'end';
  return 'center';
}

const TOOLTIP_ALIGN_CLASS = {
  start: 'tooltipAlignStart',
  center: 'tooltipAlignCenter',
  end: 'tooltipAlignEnd',
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function PriceRangeFilter({
  boundsMin,
  boundsMax,
  valueMin,
  valueMax,
  onChange,
  onReset,
  currency = 'UZS',
}) {
  const [fromInput, setFromInput] = useState(String(valueMin));
  const [toInput, setToInput] = useState(String(valueMax));
  const isActive = valueMin > boundsMin || valueMax < boundsMax;
  const range = boundsMax - boundsMin || 1;
  const minPercent = ((valueMin - boundsMin) / range) * 100;
  const maxPercent = ((valueMax - boundsMin) / range) * 100;

  useEffect(() => {
    setFromInput(String(valueMin));
    setToInput(String(valueMax));
  }, [valueMin, valueMax]);

  const updateRange = (nextMin, nextMax) => {
    const min = clamp(Math.round(nextMin), boundsMin, boundsMax);
    const max = clamp(Math.round(nextMax), boundsMin, boundsMax);

    onChange({
      min: Math.min(min, max),
      max: Math.max(min, max),
    });
  };

  const handleMinSlider = (event) => {
    updateRange(Number(event.target.value), valueMax);
  };

  const handleMaxSlider = (event) => {
    updateRange(valueMin, Number(event.target.value));
  };

  const commitFromInput = () => {
    const parsed = Number(fromInput.replace(/\s/g, ''));

    if (Number.isFinite(parsed)) {
      updateRange(parsed, valueMax);
      return;
    }

    setFromInput(String(valueMin));
  };

  const commitToInput = () => {
    const parsed = Number(toInput.replace(/\s/g, ''));

    if (Number.isFinite(parsed)) {
      updateRange(valueMin, parsed);
      return;
    }

    setToInput(String(valueMax));
  };

  return (
    <div className={`${styles.filter} ${isActive ? styles.filterActive : ''}`}>
      <div className={styles.header}>
        <span className={styles.title}>Цена</span>
        {isActive && (
          <button type="button" className={styles.reset} onClick={onReset}>
            Сбросить
          </button>
        )}
      </div>

      <div className={styles.sliderWrap}>
        <div className={styles.sliderTrack}>
          <div
            className={styles.sliderProcess}
            style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
          />
        </div>

        <input
          type="range"
          className={`${styles.sliderInput} ${styles.sliderInputMin}`}
          min={boundsMin}
          max={boundsMax}
          value={valueMin}
          onChange={handleMinSlider}
          aria-label="Минимальная цена"
        />
        <input
          type="range"
          className={`${styles.sliderInput} ${styles.sliderInputMax}`}
          min={boundsMin}
          max={boundsMax}
          value={valueMax}
          onChange={handleMaxSlider}
          aria-label="Максимальная цена"
        />

        <div
          className={`${styles.tooltipMin} ${styles[TOOLTIP_ALIGN_CLASS[getTooltipAlign(minPercent)]]}`}
          style={{ left: `${minPercent}%` }}
        >
          {formatPrice(valueMin)}
        </div>
        <div
          className={`${styles.tooltipMax} ${styles[TOOLTIP_ALIGN_CLASS[getTooltipAlign(maxPercent)]]}`}
          style={{ left: `${maxPercent}%` }}
        >
          {formatPrice(valueMax)}
        </div>
      </div>

      <div className={styles.limits}>
        <div className={styles.limit}>
          {formatPrice(boundsMin)} <span>{currency}</span>
        </div>
        <div className={styles.limit}>
          {formatPrice(boundsMax)} <span>{currency}</span>
        </div>
      </div>

      <div className={styles.inputs}>
        <div className={styles.inputWrap}>
          <input
            type="number"
            value={fromInput}
            min={boundsMin}
            max={boundsMax}
            onChange={(event) => setFromInput(event.target.value)}
            onBlur={commitFromInput}
            onKeyDown={(event) => event.key === 'Enter' && commitFromInput()}
            aria-label="Цена от"
          />
        </div>
        <div className={styles.separator} />
        <div className={styles.inputWrap}>
          <input
            type="number"
            value={toInput}
            min={boundsMin}
            max={boundsMax}
            onChange={(event) => setToInput(event.target.value)}
            onBlur={commitToInput}
            onKeyDown={(event) => event.key === 'Enter' && commitToInput()}
            aria-label="Цена до"
          />
        </div>
      </div>
    </div>
  );
}
