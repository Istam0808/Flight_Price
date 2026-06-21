import { NextResponse } from 'next/server';
import { B2B_SESSION_EXPIRED_CODE, checkAvailability, loadAdditionalServices } from '@/lib/api';
import { clearStoredB2BSessionCookie, getStoredB2BSessionCookie } from '@/lib/b2bAuth';
import { getUserFromRequest } from '@/lib/firebase/session';
import { buildB2BOrderUrl } from '@/lib/utils';

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
    if (err.code === B2B_SESSION_EXPIRED_CODE) {
      return getB2BSessionExpiredResponse();
    }

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
