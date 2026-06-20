import dayjs from 'dayjs';
import { getAirportByCode } from '@/lib/airports';
import { formatPrice } from '@/lib/utils';

const CITY_NAMES = {
  Tashkent: 'TOSHKENT',
  Samarkand: 'SAMARQAND',
  Antalya: 'ANTALIYA',
  Istanbul: 'ISTANBUL',
  Dubai: 'DUBAI',
  Moscow: 'MOSKVA',
  'Saint Petersburg': 'SANKT-PETERBURG',
};

const O_CLOCK_EMOJIS = ['🕛', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚'];
const HALF_PAST_EMOJIS = ['🕧', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦'];

export function formatOffersForTelegram(results, { from, to } = {}) {
  const flights = collectFlights(results);

  if (!flights.length) {
    return '';
  }

  const fromAirport = getAirportByCode(from) || { code: from?.toUpperCase(), location: from, country: '' };
  const toAirport = getAirportByCode(to) || { code: to?.toUpperCase(), location: to, country: '' };
  const fromCity = formatCityName(fromAirport);
  const toCity = formatCityName(toAirport);
  const fromFlag = countryFlag(fromAirport.country);
  const toFlag = countryFlag(toAirport.country);
  const carriers = collectCarrierNames(flights);
  const lines = [];

  lines.push(`🔥🔥🔥 ${toTelegramBold(`MAXSUS TAKLIF — ${toCity}`)} 🔥🔥🔥`);
  lines.push('');
  lines.push(`✈️ ${toTelegramBold(carriers.join(' / '))}`);
  lines.push('');
  lines.push(`${fromFlag} ${fromCity} — ${toCity} ${toFlag}`);
  lines.push('');
  lines.push(`${fromFlag} ${fromAirport.code} → ${toAirport.code} ${toFlag}`);

  flights.forEach((flight) => {
    lines.push(formatFlightLine(flight));
  });

  const baggageLine = resolveBaggageLine(flights);
  if (baggageLine) {
    lines.push('');
    lines.push(baggageLine);
  }

  return lines.join('\n');
}

function collectFlights(results) {
  return Object.keys(results || {})
    .sort()
    .flatMap((date) => results[date] || [])
    .sort((a, b) => {
      const dateCompare = String(a.date).localeCompare(String(b.date));
      if (dateCompare !== 0) return dateCompare;
      return (a.price || 0) - (b.price || 0);
    });
}

function collectCarrierNames(flights) {
  const names = new Set();

  flights.forEach((flight) => {
    if (flight.carrier_name) {
      names.add(flight.carrier_name.toUpperCase());
    }
  });

  return Array.from(names).sort((a, b) => a.localeCompare(b, 'ru'));
}

function formatFlightLine(flight) {
  const dateLabel = dayjs(flight.date).format('DD.MM.YYYY');
  const departureTime = sliceTime(flight.departure_time);
  const arrivalTime = sliceTime(flight.arrival_time);
  const priceLabel = formatPrice(flight.price, flight.currency || 'UZS');
  const carrierCode = flight.carrier_code || '—';

  return `📆 ${dateLabel} | ${clockEmoji(flight.departure_time)} ${departureTime} – ${arrivalTime} | 💵 ${priceLabel} | ${carrierCode}`;
}

function resolveBaggageLine(flights) {
  const counts = new Map();

  flights.forEach((flight) => {
    const baggage = String(flight.baggage || '').trim();
    if (!baggage) return;
    counts.set(baggage, (counts.get(baggage) || 0) + 1);
  });

  if (!counts.size) return '';

  const [baggage] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return `🧳 BAGAJ: ${baggage.toUpperCase()}`;
}

function formatCityName(airport) {
  const location = String(airport?.location || airport?.code || '').trim();
  if (!location) return String(airport?.code || '').toUpperCase();

  if (CITY_NAMES[location]) {
    return CITY_NAMES[location];
  }

  return location.toUpperCase();
}

function countryFlag(iso2) {
  const code = String(iso2 || '').trim().toUpperCase();
  if (code.length !== 2) return '';

  return String.fromCodePoint(
    ...[...code].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65),
  );
}

function toTelegramBold(text) {
  return String(text || '')
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        return String.fromCodePoint(0x1d400 + (code - 65));
      }
      return char;
    })
    .join('');
}

function clockEmoji(time) {
  const match = String(time || '').match(/^(\d{1,2}):(\d{2})/);
  if (!match) return '🕐';

  let hour = Number(match[1]) % 12;
  const minutes = Number(match[2]);

  if (hour === 0) hour = 12;

  if (minutes >= 45) {
    hour = hour === 12 ? 1 : hour + 1;
    return O_CLOCK_EMOJIS[hour - 1];
  }

  if (minutes >= 15) {
    return HALF_PAST_EMOJIS[hour - 1];
  }

  return O_CLOCK_EMOJIS[hour - 1];
}

function sliceTime(time) {
  if (!time) return '--:--';
  return String(time).slice(0, 5);
}
