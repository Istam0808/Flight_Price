import { NextResponse } from 'next/server';
import { startSearch } from '@/lib/api';
import { getStoredB2BSessionCookie } from '@/lib/b2bAuth';
import { getUserFromRequest } from '@/lib/firebase/session';

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
    const status = /Session expired/i.test(err.message) ? 403 : 500;

    return NextResponse.json({ error: err.message }, { status });
  }
}
