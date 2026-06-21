import { NextResponse } from 'next/server';
import { B2B_SESSION_EXPIRED_CODE, pollOffers, filterAndNormalize } from '@/lib/api';
import { clearStoredB2BSessionCookie, getStoredB2BSessionCookie } from '@/lib/b2bAuth';
import { getUserFromRequest } from '@/lib/firebase/session';

function getB2BSessionExpiredResponse() {
  const response = NextResponse.json(
    { error: 'B2B сессия истекла. Войдите в B2B заново.', code: B2B_SESSION_EXPIRED_CODE },
    { status: 403 },
  );

  clearStoredB2BSessionCookie(response);

  return response;
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Требуется вход в систему' }, { status: 401 });
    }

    const manualSessionCookie = request.headers.get('x-b2b-session-cookie')?.trim() || '';
    const sessionCookie = getStoredB2BSessionCookie(request) || manualSessionCookie;
    const { request_id, carrier_code } = await request.json();

    if (!request_id) {
      return NextResponse.json({ error: 'request_id обязателен' }, { status: 400 });
    }

    const isAllCarriers = !carrier_code || carrier_code === 'all';
    const carrier = isAllCarriers ? '' : carrier_code;
    const rawOffers = await pollOffers(request_id, { sessionCookie });
    const flights = filterAndNormalize(rawOffers, carrier).map((flight) => ({
      ...flight,
      request_id,
    }));

    return NextResponse.json({ flights, total: flights.length });
  } catch (err) {
    console.error('[/api/offers]', err);
    if (err.code === B2B_SESSION_EXPIRED_CODE) {
      return getB2BSessionExpiredResponse();
    }

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
