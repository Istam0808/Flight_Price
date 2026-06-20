const BASE = 'https://b2b.prestigevoyage.uz/api/air';
const COOKIE = 'etmsessid=5wRX5aYJhgu8mk9YlSdfdaDeGxsf4RMt85oTL0QS';

const headers = {
  'Content-Type': 'application/json',
  Cookie: COOKIE,
};

const searchRes = await fetch(`${BASE}/search`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    directions: [{ departure_code: 'TAS', arrival_code: 'IST', date: '2026-06-25', time: '', dir_number: 1 }],
    adult_qnt: 1,
    child_qnt: 0,
    infant_qnt: 0,
    class: 'E',
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

const searchData = await searchRes.json();
console.log('search status:', searchData.status, 'request_id:', searchData.request_id);

let offers = [];
let next_token = null;

for (let i = 0; i < 8; i += 1) {
  const body = { request_id: searchData.request_id, sort: 'price', ...(next_token && { next_token }) };
  const res = await fetch(`${BASE}/offers`, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (Array.isArray(data.offers)) offers.push(...data.offers);
  console.log('poll', i, 'status:', data.status, 'chunk offers:', data.offers?.length || 0);
  if (data.status !== 'InProcess') break;
  next_token = data.next_token;
  await new Promise((r) => setTimeout(r, 1200));
}

console.log('total carrier groups:', offers.length);

const rows = [];
for (const o of offers.slice(0, 3)) {
  for (const offer of o.offers || []) {
    for (const seg of offer.segments || []) {
      rows.push({
        carrier: o.carrier_code,
        segBuyId: seg.buy_id,
        offerBuyId: offer.buy_id,
        offerKeys: Object.keys(offer).filter((k) => k.includes('buy') || k.includes('id')),
        segKeys: Object.keys(seg).filter((k) => k.includes('buy') || k.includes('id')),
        route: `${seg.departure_airport}->${seg.arrival_airport}`,
        price: seg.price ?? offer.min_price,
      });
    }
  }
}

console.log(JSON.stringify(rows.slice(0, 8), null, 2));

const first = rows.find((r) => r.segBuyId);
if (first) {
  console.log('\nURL:', `https://b2b.prestigevoyage.uz/agent/search/order?RequestId=${searchData.request_id}&Segment=${first.segBuyId}`);
}
