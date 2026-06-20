import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://ucsol.ru/tamozhennoe-oformlenie/v-aeroportakh-uslugi-tamozhennogo-brokera';

const RANGE_SLUGS = [
  'kody-vsekh-aeroportov-mira-iata',
  'airport-codes-ba-bz',
  'airport-codes-ca-cz',
  'airport-codes-da-dz',
  'airport-codes-ea-ez',
  'airport-codes-fa-fz',
  'airport-codes-ga-gz',
  'airport-codes-ga-gz',
  'airport-codes-ha-hz',
  'airport-codes-ia-iz',
  'airport-codes-ja-jz',
  'airport-codes-ka-kz',
  'airport-codes-la-lz',
  'airport-codes-ma-mz',
  'airport-codes-na-nz',
  'airport-codes-oa-oz',
  'airport-codes-pa-pz',
  'airport-codes-qa-qz',
  'airport-codes-ra-rz',
  'airport-codes-sa-sz',
  'airport-codes-ta-tz',
  'airport-codes-ua-uz',
  'airport-codes-va-vz',
  'airport-codes-wa-wz',
  'airport-codes-xa-xz',
  'airport-codes-ya-yz',
  'airport-codes-za-zz',
];

const COUNTRY_CODES = {
  Afghanistan: 'AF',
  Albania: 'AL',
  Algeria: 'DZ',
  'American Samoa': 'AS',
  Andorra: 'AD',
  Angola: 'AO',
  Argentina: 'AR',
  Armenia: 'AM',
  Australia: 'AU',
  Austria: 'AT',
  Azerbaijan: 'AZ',
  Bahrain: 'BH',
  Bangladesh: 'BD',
  Belarus: 'BY',
  Belgium: 'BE',
  Bolivia: 'BO',
  'Bosnia and Herzegovina': 'BA',
  Brazil: 'BR',
  Bulgaria: 'BG',
  Cambodia: 'KH',
  Cameroon: 'CM',
  Canada: 'CA',
  Chile: 'CL',
  China: 'CN',
  Colombia: 'CO',
  'Costa Rica': 'CR',
  Croatia: 'HR',
  Cuba: 'CU',
  Cyprus: 'CY',
  'Czech Republic': 'CZ',
  Czechia: 'CZ',
  Denmark: 'DK',
  'Dominican Republic': 'DO',
  Ecuador: 'EC',
  Egypt: 'EG',
  Estonia: 'EE',
  Ethiopia: 'ET',
  Finland: 'FI',
  France: 'FR',
  Georgia: 'GE',
  Germany: 'DE',
  Ghana: 'GH',
  Greece: 'GR',
  Guatemala: 'GT',
  Honduras: 'HN',
  'Hong Kong': 'HK',
  Hungary: 'HU',
  Iceland: 'IS',
  India: 'IN',
  Indonesia: 'ID',
  Iran: 'IR',
  Iraq: 'IQ',
  Ireland: 'IE',
  Israel: 'IL',
  Italy: 'IT',
  Japan: 'JP',
  Jordan: 'JO',
  Kazakhstan: 'KZ',
  Kenya: 'KE',
  Kuwait: 'KW',
  Kyrgyzstan: 'KG',
  Latvia: 'LV',
  Lebanon: 'LB',
  Libya: 'LY',
  Lithuania: 'LT',
  Luxembourg: 'LU',
  Malaysia: 'MY',
  Malta: 'MT',
  Mexico: 'MX',
  Moldova: 'MD',
  Mongolia: 'MN',
  Montenegro: 'ME',
  Morocco: 'MA',
  Myanmar: 'MM',
  Nepal: 'NP',
  Netherlands: 'NL',
  'New Zealand': 'NZ',
  Nigeria: 'NG',
  'North Korea': 'KP',
  Norway: 'NO',
  Oman: 'OM',
  Pakistan: 'PK',
  Panama: 'PA',
  Paraguay: 'PY',
  Peru: 'PE',
  Philippines: 'PH',
  Poland: 'PL',
  Portugal: 'PT',
  Qatar: 'QA',
  Romania: 'RO',
  Russia: 'RU',
  'Russian Federation': 'RU',
  'Saudi Arabia': 'SA',
  Serbia: 'RS',
  Singapore: 'SG',
  Slovakia: 'SK',
  Slovenia: 'SI',
  'South Africa': 'ZA',
  'South Korea': 'KR',
  Korea: 'KR',
  Spain: 'ES',
  'Sri Lanka': 'LK',
  Sudan: 'SD',
  Sweden: 'SE',
  Switzerland: 'CH',
  Syria: 'SY',
  Taiwan: 'TW',
  Tajikistan: 'TJ',
  Tanzania: 'TZ',
  Thailand: 'TH',
  Tunisia: 'TN',
  Turkey: 'TR',
  Turkmenistan: 'TM',
  Ukraine: 'UA',
  'United Arab Emirates': 'AE',
  'United Kingdom': 'GB',
  'United States': 'US',
  'United States of America': 'US',
  Uruguay: 'UY',
  Uzbekistan: 'UZ',
  Venezuela: 'VE',
  Vietnam: 'VN',
  Yemen: 'YE',
  Zimbabwe: 'ZW',
  'French Polynesia': 'PF',
  'Côte d\'Ivoire': 'CI',
  'Cote d\'Ivoire': 'CI',
  Suriname: 'SR',
  Kiribati: 'KI',
  Samoa: 'WS',
  Namibia: 'NA',
  Mauritania: 'MR',
  Chad: 'TD',
  'Solomon Islands': 'SB',
  'Papua New Guinea': 'PG',
  'New Caledonia': 'NC',
  Fiji: 'FJ',
  Maldives: 'MV',
  Mauritius: 'MU',
  Seychelles: 'SC',
  Madagascar: 'MG',
  Laos: 'LA',
  Brunei: 'BN',
  Macau: 'MO',
  'Puerto Rico': 'PR',
  Jamaica: 'JM',
  Bahamas: 'BS',
  Barbados: 'BB',
  Bermuda: 'BM',
  Greenland: 'GL',
  Iceland: 'IS',
  Liechtenstein: 'LI',
  Monaco: 'MC',
  'San Marino': 'SM',
  Vatican: 'VA',
  Kosovo: 'XK',
  Gibraltar: 'GI',
  'Faroe Islands': 'FO',
  Guadeloupe: 'GP',
  Martinique: 'MQ',
  Reunion: 'RE',
  Mayotte: 'YT',
  Guernsey: 'GG',
  Jersey: 'JE',
  'Isle of Man': 'IM',
  Aruba: 'AW',
  Curacao: 'CW',
  'Sint Maarten': 'SX',
  Belize: 'BZ',
  Nicaragua: 'NI',
  'El Salvador': 'SV',
  Haiti: 'HT',
  Surinam: 'SR',
};

function stripTags(value) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function parseTableRows(html) {
  const rows = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;

  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const cells = [...match[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) =>
      stripTags(cell[1]).trim(),
    );

    if (cells.length < 4) continue;

    const code = cells[0];
    if (!/^[A-Z0-9]{3}$/.test(code)) continue;

    let name;
    let location;
    let country;

    if (cells.length >= 5) {
      name = cells[2];
      location = cells[3];
      country = cells[4];
    } else {
      name = cells[2];
      const locationWithCountry = cells[3];
      const parts = locationWithCountry.split(',').map((part) => part.trim()).filter(Boolean);

      if (parts.length >= 2) {
        country = parts[parts.length - 1];
        location = parts.slice(0, -1).join(', ');
      } else {
        location = locationWithCountry;
        country = '';
      }
    }

    if (!name) continue;

    rows.push({ code, name, location, country });
  }

  return rows;
}

function parseMarkdownTable(content) {
  const rows = [];
  const lines = content.split('\n');

  for (const line of lines) {
    if (!line.startsWith('|')) continue;
    if (line.includes('Код IATA') || line.includes('--------')) continue;

    const cells = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());

    if (cells.length < 5) continue;

    const code = cells[0];
    const name = cells[2];
    const location = cells[3];
    const country = cells[4];

    if (!/^[A-Z0-9]{3}$/.test(code) || !name) continue;

    rows.push({ code, name, location, country });
  }

  return rows;
}

function countryToCode(country) {
  return COUNTRY_CODES[country] || country;
}

function normalizeAirport(row) {
  return {
    code: row.code,
    name: row.name,
    location: row.location || '',
    country: countryToCode(row.country),
  };
}

async function fetchRange(slug) {
  const url = `${BASE}/${slug}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`Skip ${slug}: HTTP ${res.status}`);
    return [];
  }

  const html = await res.text();
  const rows = parseTableRows(html);
  console.log(`${slug}: ${rows.length}`);
  return rows;
}

async function main() {
  const all = new Map();
  const uniqueSlugs = [...new Set(RANGE_SLUGS)];

  for (const slug of uniqueSlugs) {
    const rows = await fetchRange(slug);
    for (const row of rows) {
      all.set(row.code, normalizeAirport(row));
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  const mdPath = path.resolve('uploads/kody-vsekh-aeroportov-mira-iata-0.md');
  if (fs.existsSync(mdPath)) {
    const mdRows = parseMarkdownTable(fs.readFileSync(mdPath, 'utf8'));
    console.log(`markdown backup: ${mdRows.length}`);
    for (const row of mdRows) {
      all.set(row.code, normalizeAirport(row));
    }
  }

  const extraAirports = [
    {
      code: 'MOW',
      name: 'Moscow (all airports)',
      location: 'Moscow',
      country: 'Russia',
    },
    {
      code: 'SKD',
      name: 'Samarkand International Airport',
      location: 'Samarkand',
      country: 'Uzbekistan',
    },
    {
      code: 'BHK',
      name: 'Bukhara International Airport',
      location: 'Bukhara',
      country: 'Uzbekistan',
    },
    {
      code: 'NMA',
      name: 'Namangan Airport',
      location: 'Namangan',
      country: 'Uzbekistan',
    },
    {
      code: 'NCU',
      name: 'Nukus Airport',
      location: 'Nukus',
      country: 'Uzbekistan',
    },
    {
      code: 'FEG',
      name: 'Fergana International Airport',
      location: 'Fergana',
      country: 'Uzbekistan',
    },
  ];

  for (const airport of extraAirports) {
    all.set(airport.code, normalizeAirport(airport));
  }

  const airports = [...all.values()].sort((a, b) => a.code.localeCompare(b.code));

  console.log(`Total unique airports: ${airports.length}`);

  const dataContent = `// Auto-generated from https://ucsol.ru IATA airport tables\nexport const AIRPORTS = ${JSON.stringify(airports)};\n`;
  fs.writeFileSync(path.resolve('src/lib/airports.data.js'), dataContent, 'utf8');

  const logicContent = `import { AIRPORTS as GENERATED_AIRPORTS } from './airports.data';

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
  const place = airport.location ? \`, \${airport.location}\` : '';
  return \`\${airport.code} — \${airport.name}\${place}\`;
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
`;

  fs.writeFileSync(path.resolve('src/lib/airports.js'), logicContent, 'utf8');
  console.log('Updated src/lib/airports.js and src/lib/airports.data.js');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
