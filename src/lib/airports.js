import { AIRPORTS as GENERATED_AIRPORTS } from './airports.data';

export const AIRPORTS = GENERATED_AIRPORTS;

const AIRPORT_MAP = new Map(AIRPORTS.map((airport) => [airport.code, airport]));

const QUERY_ALIASES = {
  mov: 'mow',
  mow: 'mow',
  москва: 'moscow',
  питер: 'petersburg',
  'санкт-петербург': 'petersburg',
  ташкент: 'tashkent',
  самарканд: 'samarkand',
  samarkand: 'samarkand',
  skd: 'skd',
  бухара: 'bukhara',
  дубай: 'dubai',
  стамбул: 'istanbul',
  анталия: 'antalya',
  алматы: 'almaty',
  астана: 'astana',
  бишкек: 'bishkek',
  ереван: 'yerevan',
  тбилиси: 'tbilisi',
  баку: 'baku',
  минск: 'minsk',
  киев: 'kyiv',
  варшава: 'warsaw',
  франкфурт: 'frankfurt',
  париж: 'paris',
  лондон: 'london',
};

const CYRILLIC_MAP = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

function transliterate(value) {
  return value
    .toLowerCase()
    .split('')
    .map((char) => CYRILLIC_MAP[char] ?? char)
    .join('');
}

function normalizeQuery(query) {
  const trimmed = query.trim().toLowerCase();
  return QUERY_ALIASES[trimmed] || transliterate(trimmed);
}

export function getAirportByCode(code) {
  return AIRPORT_MAP.get(code?.toUpperCase()) || null;
}

export function formatAirport(airport) {
  if (!airport) return '';
  const place = airport.location ? `, ${airport.location}` : '';
  return `${airport.code} — ${airport.name}${place}`;
}

function airportHaystack(airport) {
  return [
    airport.code,
    airport.name,
    airport.location,
    airport.country,
  ]
    .join(' ')
    .toLowerCase();
}

export function searchAirports(query, limit = 10) {
  const normalized = normalizeQuery(query);

  if (!normalized) {
    return AIRPORTS.slice(0, limit);
  }

  const scored = AIRPORTS.map((airport) => {
    const code = airport.code.toLowerCase();
    const haystack = airportHaystack(airport);

    let score = 0;

    if (code === normalized) score += 100;
    else if (code.startsWith(normalized)) score += 80;
    else if (haystack.startsWith(normalized)) score += 65;
    else if (haystack.includes(normalized)) score += 30;

    return { airport, score };
  })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.airport.code.localeCompare(b.airport.code));

  return scored.slice(0, limit).map(({ airport }) => airport);
}
