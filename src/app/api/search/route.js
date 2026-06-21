import { NextResponse } from 'next/server';
import { B2B_SESSION_EXPIRED_CODE, startSearch } from '@/lib/api';
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
    const body = await request.json();
    const { from, to, date, flightClass } = body;

    if (!from || !to || !date) {
      return NextResponse.json(
        { error: 'Обязательные поля: from, to, date' },
        { status: 400 },
      );
    }

    const request_id = await startSearch({
      from,
      to,
      date,
      flightClass,
      sessionCookie,
    });
    return NextResponse.json({ request_id });
  } catch (err) {
    console.error('[/api/search]', err);

    if (err.code === B2B_SESSION_EXPIRED_CODE) {
      return getB2BSessionExpiredResponse();
    }

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
