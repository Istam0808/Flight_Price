import dayjs from 'dayjs';

export function formatPrice(amount, currency = 'UZS') {
  const normalizedAmount = Number(amount) || 0;

  if (currency === 'UZS') {
    return `${new Intl.NumberFormat('ru-RU').format(Math.round(normalizedAmount))} UZS`;
  }

  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(normalizedAmount);
}

export function generateDateRange(startDate, days) {
  return Array.from({ length: days }, (_, i) =>
    dayjs(startDate).add(i, 'day').format('YYYY-MM-DD'),
  );
}

export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
}

export function formatDate(dateStr) {
  return dayjs(dateStr).format('D MMMM');
}

export function stopsLabel(stops) {
  if (stops === 0) return 'Прямой';
  if (stops === 1) return '1 пересадка';
  return `${stops} пересадки`;
}
