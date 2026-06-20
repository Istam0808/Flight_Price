import { NextResponse } from 'next/server';
import { pollOffers, filterAndNormalize } from '@/lib/api';

export async function POST(request) {
  try {
    const sessionCookie = request.headers.get('x-b2b-session-cookie')?.trim() || '';
    const { request_id, carrier_code } = await request.json();

    if (!request_id) {
      return NextResponse.json({ error: 'request_id обязателен' }, { status: 400 });
    }

    const isAllCarriers = !carrier_code || carrier_code === 'all';
    const carrier = isAllCarriers ? '' : carrier_code;
    const rawOffers = await pollOffers(request_id, { sessionCookie });
    const flights = filterAndNormalize(rawOffers, carrier);

    return NextResponse.json({ flights, total: flights.length });
  } catch (err) {
    console.error('[/api/offers]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
