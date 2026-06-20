export const AIRPORTS = [
  { code: 'TAS', name: 'Ташкент', country: 'UZ', keywords: ['ташкент', 'tashkent'] },
  { code: 'SKD', name: 'Самарканд', country: 'UZ', keywords: ['самарканд', 'samarkand'] },
  { code: 'BHK', name: 'Бухара', country: 'UZ', keywords: ['бухара', 'bukhara'] },
  { code: 'NMA', name: 'Наманган', country: 'UZ', keywords: ['наманган', 'namangan'] },
  { code: 'NCU', name: 'Нукус', country: 'UZ', keywords: ['нукус', 'nukus'] },
  { code: 'UGC', name: 'Ургенч', country: 'UZ', keywords: ['ургенч', 'urgench'] },
  { code: 'TMJ', name: 'Термез', country: 'UZ', keywords: ['термез', 'termez'] },
  { code: 'FEG', name: 'Фергана', country: 'UZ', keywords: ['fergana', 'фергана'] },
  { code: 'MOW', name: 'Москва (все аэропорты)', country: 'RU', keywords: ['москва', 'moscow', 'mov', 'mow'] },
  { code: 'SVO', name: 'Москва Шереметьево', country: 'RU', keywords: ['москва', 'moscow', 'шереметьево', 'svo'] },
  { code: 'DME', name: 'Москва Домодедово', country: 'RU', keywords: ['москва', 'moscow', 'домодедово', 'dme'] },
  { code: 'VKO', name: 'Москва Внуково', country: 'RU', keywords: ['москва', 'moscow', 'внуково', 'vko'] },
  { code: 'LED', name: 'Санкт-Петербург', country: 'RU', keywords: ['питер', 'spb', 'saint petersburg', 'санкт-петербург'] },
  { code: 'SVX', name: 'Екатеринбург', country: 'RU', keywords: ['екатеринбург', 'yekaterinburg'] },
  { code: 'KRR', name: 'Краснодар', country: 'RU', keywords: ['краснодар', 'krasnodar'] },
  { code: 'ROV', name: 'Ростов-на-Дону', country: 'RU', keywords: ['ростов', 'rostov'] },
  { code: 'KUF', name: 'Самара', country: 'RU', keywords: ['самара', 'samara'] },
  { code: 'UFA', name: 'Уфа', country: 'RU', keywords: ['ufa'] },
  { code: 'KZN', name: 'Казань', country: 'RU', keywords: ['казань', 'kazan'] },
  { code: 'OVB', name: 'Новосибирск', country: 'RU', keywords: ['новосибирск', 'novosibirsk'] },
  { code: 'IST', name: 'Стамбул', country: 'TR', keywords: ['istanbul', 'стамбул'] },
  { code: 'SAW', name: 'Стамбул Sabiha Gökçen', country: 'TR', keywords: ['istanbul', 'стамбул', 'sabiha'] },
  { code: 'AYT', name: 'Анталия', country: 'TR', keywords: ['antalya', 'анталия'] },
  { code: 'ADB', name: 'Измир', country: 'TR', keywords: ['izmir', 'измир'] },
  { code: 'ESB', name: 'Анкара', country: 'TR', keywords: ['ankara', 'анкара'] },
  { code: 'DXB', name: 'Дубай', country: 'AE', keywords: ['dubai', 'дубай'] },
  { code: 'AUH', name: 'Абу-Даби', country: 'AE', keywords: ['abu dhabi', 'абу-даби'] },
  { code: 'SHJ', name: 'Шарджа', country: 'AE', keywords: ['sharjah', 'шарджа'] },
  { code: 'DOH', name: 'Доха', country: 'QA', keywords: ['doha', 'доха'] },
  { code: 'KWI', name: 'Кувейт', country: 'KW', keywords: ['kuwait', 'кувейт'] },
  { code: 'RUH', name: 'Эр-Рияд', country: 'SA', keywords: ['riyadh', 'эриад', 'эр-рияд'] },
  { code: 'JED', name: 'Джидда', country: 'SA', keywords: ['jeddah', 'джидда'] },
  { code: 'WAW', name: 'Варшава', country: 'PL', keywords: ['warsaw', 'варшава'] },
  { code: 'FRA', name: 'Франкфурт', country: 'DE', keywords: ['frankfurt', 'франкфурт'] },
  { code: 'MUC', name: 'Мюнхен', country: 'DE', keywords: ['munich', 'мюнхен'] },
  { code: 'CDG', name: 'Париж', country: 'FR', keywords: ['paris', 'париж'] },
  { code: 'LHR', name: 'Лондон', country: 'GB', keywords: ['london', 'лондон'] },
  { code: 'DEL', name: 'Дели', country: 'IN', keywords: ['delhi', 'дели'] },
  { code: 'BKK', name: 'Бангкок', country: 'TH', keywords: ['bangkok', 'бангкок'] },
  { code: 'ICN', name: 'Сеул', country: 'KR', keywords: ['seoul', 'сеул'] },
  { code: 'PEK', name: 'Пекин', country: 'CN', keywords: ['beijing', 'пекин'] },
  { code: 'ALA', name: 'Алматы', country: 'KZ', keywords: ['almaty', 'алматы'] },
  { code: 'NQZ', name: 'Астана', country: 'KZ', keywords: ['astana', 'астана'] },
  { code: 'FRU', name: 'Бишкек', country: 'KG', keywords: ['bishkek', 'бишкек'] },
  { code: 'EVN', name: 'Ереван', country: 'AM', keywords: ['yerevan', 'ереван'] },
  { code: 'TBS', name: 'Тбилиси', country: 'GE', keywords: ['tbilisi', 'тбилиси'] },
  { code: 'GYD', name: 'Баку', country: 'AZ', keywords: ['baku', 'баку'] },
  { code: 'MSQ', name: 'Минск', country: 'BY', keywords: ['minsk', 'минск'] },
  { code: 'KBP', name: 'Киев', country: 'UA', keywords: ['kyiv', 'kiev', 'киев'] },
  { code: 'VIE', name: 'Вена', country: 'AT', keywords: ['vienna', 'вена'] },
  { code: 'PRG', name: 'Прага', country: 'CZ', keywords: ['prague', 'прага'] },
  { code: 'MXP', name: 'Милан', country: 'IT', keywords: ['milan', 'милан'] },
  { code: 'FCO', name: 'Рим', country: 'IT', keywords: ['rome', 'рим'] },
  { code: 'BCN', name: 'Барселона', country: 'ES', keywords: ['barcelona', 'барселона'] },
  { code: 'MAD', name: 'Мадрид', country: 'ES', keywords: ['madrid', 'мадрид'] },
];

const AIRPORT_MAP = new Map(AIRPORTS.map((airport) => [airport.code, airport]));

export function getAirportByCode(code) {
  return AIRPORT_MAP.get(code?.toUpperCase()) || null;
}

export function formatAirport(airport) {
  if (!airport) return '';
  return `${airport.code} — ${airport.name}`;
}

export function searchAirports(query, limit = 10) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return AIRPORTS.slice(0, limit);
  }

  const scored = AIRPORTS.map((airport) => {
    const code = airport.code.toLowerCase();
    const name = airport.name.toLowerCase();
    const keywords = (airport.keywords || []).join(' ').toLowerCase();
    const haystack = `${code} ${name} ${keywords}`;

    let score = 0;

    if (code === normalized) score += 100;
    else if (code.startsWith(normalized)) score += 80;
    else if (name.startsWith(normalized)) score += 60;
    else if (keywords.split(' ').some((word) => word.startsWith(normalized))) score += 50;
    else if (haystack.includes(normalized)) score += 30;

    return { airport, score };
  })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.airport.name.localeCompare(b.airport.name, 'ru'));

  return scored.slice(0, limit).map(({ airport }) => airport);
}
