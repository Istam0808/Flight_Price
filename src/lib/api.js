const BASE_URL = process.env.B2B_API_URL;
const TOKEN = process.env.B2B_TOKEN;
const ETM_AUTH_KEY = process.env.B2B_ETM_AUTH_KEY;
const SESSION_COOKIE = process.env.B2B_SESSION_COOKIE;

function getHeaders({ sessionCookie } = {}) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (TOKEN) {
    headers.Authorization = `Bearer ${TOKEN}`;
  }

  if (ETM_AUTH_KEY) {
    headers['etm-auth-key'] = ETM_AUTH_KEY;
  }

  const resolvedCookie = sessionCookie || SESSION_COOKIE;
  if (resolvedCookie) {
    headers.Cookie = resolvedCookie;
  }

  return headers;
}

export async function startSearch({ from, to, date, flightClass = 'E', sessionCookie }) {
  const res = await fetch(`${BASE_URL}/search`, {
    method: 'POST',
    headers: getHeaders({ sessionCookie }),
    body: JSON.stringify({
      directions: [
        {
          departure_code: from,
          arrival_code: to,
          date,
          time: '',
          dir_number: 1,
        },
      ],
      adult_qnt: 1,
      child_qnt: 0,
      infant_qnt: 0,
      class: flightClass,
      direct: false,
      flexible: false,
      child_flexible: false,
      isGroups: false,
      onlyRefundable: false,
      schedule: false,
      searchWithBaggage: false,
      travellers: [],
      fare_types: ['PUB', 'NEG'],
    }),
  });

  if (!res.ok) {
    const details = await extractErrorMessage(res);
    throw new Error(`Search failed: ${res.status}${details ? ` - ${details}` : ''}`);
  }
  const data = await res.json();
  if (data.status !== 'ok') throw new Error(data.message || 'Search error');

  return data.request_id;
}

export async function pollOffers(request_id, { onProgress, sessionCookie } = {}) {
  let next_token = null;
  const allOffers = [];
  let attempts = 0;
  const MAX_ATTEMPTS = 30;

  while (attempts < MAX_ATTEMPTS) {
    attempts += 1;

    const body = {
      request_id,
      sort: 'price',
      ...(next_token && { next_token }),
    };

    const res = await fetch(`${BASE_URL}/offers`, {
      method: 'POST',
      headers: getHeaders({ sessionCookie }),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const details = await extractErrorMessage(res);
      throw new Error(`Offers failed: ${res.status}${details ? ` - ${details}` : ''}`);
    }
    const data = await res.json();

    if (Array.isArray(data.offers) && data.offers.length > 0) {
      allOffers.push(...data.offers);
      onProgress?.(allOffers.length);
    }

    if (data.status !== 'InProcess') break;

    next_token = data.next_token;
    await sleep(1200);
  }

  return allOffers;
}

export function filterAndNormalize(offers, carrierCode) {
  const normalizedCarrier = carrierCode ? carrierCode.toUpperCase() : '';

  return offers
    .filter((o) => !normalizedCarrier || o.carrier_code === normalizedCarrier)
    .flatMap((o) =>
      (o.offers || []).flatMap((offer) =>
        (offer.segments || []).filter((seg) => seg.buy_id).map((seg) => {
          const legs = seg.flights_info || [];

          return {
            carrier_code: o.carrier_code,
            carrier_name: o.carrier_name,
            carrier_logo: o.carrier_logo,
            price: seg.price ?? offer.min_price ?? 0,
            currency: 'UZS',
            date: seg.departure_date,
            departure_time: seg.departure_time,
            arrival_time: seg.arrival_time,
            departure_airport: seg.departure_airport,
            arrival_airport: seg.arrival_airport,
            duration_minutes: seg.duration_minutes,
            duration_text: seg.duration_formated,
            stops: seg.stops,
            baggage: seg.baggage,
            booking_class: seg.class,
            tariff: seg.tariff,
            pcc_name: seg.pcc_name,
            fare_label: seg.prov_fare_type?.label || null,
            seats: seg.seats,
            flight_numbers: legs.map((l) => l.flight_number_print).join(' + '),
            buy_id: seg.buy_id,
            is_direct: seg.stops === 0,
          };
        }),
      ),
    )
    .sort((a, b) => a.price - b.price);
}

export async function checkAvailability({ request_id, buy_id, sessionCookie }) {
  const url = `${BASE_URL}/offers/${encodeURIComponent(buy_id)}/availability?request_id=${encodeURIComponent(request_id)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: getHeaders({ sessionCookie }),
  });

  if (!res.ok) {
    const details = await extractErrorMessage(res);

    if (res.status === 404 && /already allocated/i.test(details)) {
      return {
        availability: true,
        request_id: null,
        buy_id: String(buy_id),
        alreadyAllocated: true,
      };
    }

    throw new Error(`Availability failed: ${res.status}${details ? ` - ${details}` : ''}`);
  }

  const data = await res.json();
  if (data.status !== 'ok') {
    throw new Error(data.message || 'Availability check failed');
  }

  return {
    availability: data.availability,
    request_id: data.request_id,
    buy_id: data.buy_id,
    alreadyAllocated: false,
  };
}

export async function loadAdditionalServices({ request_id, segment, sessionCookie }) {
  const url = `${BASE_URL}/offers/${encodeURIComponent(request_id)}/additional-services?segment=${encodeURIComponent(segment)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: getHeaders({ sessionCookie }),
  });

  if (!res.ok) {
    const details = await extractErrorMessage(res);
    const error = new Error(`Additional services failed: ${res.status}${details ? ` - ${details}` : ''}`);
    error.status = res.status;
    throw error;
  }

  return res.json();
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function extractErrorMessage(res) {
  try {
    const text = await res.text();
    if (!text) return '';

    try {
      const data = JSON.parse(text);
      return data.message || data.error || text;
    } catch {
      return text;
    }
  } catch {
    return '';
  }
}
