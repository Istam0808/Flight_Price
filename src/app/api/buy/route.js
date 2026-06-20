import { NextResponse } from 'next/server';
import { checkAvailability, loadAdditionalServices } from '@/lib/api';
import { getStoredB2BSessionCookie } from '@/lib/b2bAuth';
import { buildB2BOrderUrl } from '@/lib/utils';

export async function POST(request) {
  try {
    const manualSessionCookie = request.headers.get('x-b2b-session-cookie')?.trim() || '';
    const sessionCookie = getStoredB2BSessionCookie(request) || manualSessionCookie;
    const { request_id, buy_id } = await request.json();

    if (!request_id || !buy_id) {
      return NextResponse.json({ error: 'request_id и buy_id обязательны' }, { status: 400 });
    }

    const availability = await checkAvailability({ request_id, buy_id, sessionCookie });

    if (!availability.availability) {
      return NextResponse.json({ error: 'Билет недоступен для покупки' }, { status: 409 });
    }

    if (!availability.alreadyAllocated && availability.request_id) {
      try {
        await loadAdditionalServices({
          request_id: availability.request_id,
          segment: availability.buy_id,
          sessionCookie,
        });
      } catch (servicesErr) {
        console.warn('[/api/buy] additional-services skipped:', servicesErr.message);
      }
    }

    const orderUrl = buildB2BOrderUrl(request_id, availability.buy_id);

    return NextResponse.json({ orderUrl });
  } catch (err) {
    console.error('[/api/buy]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
