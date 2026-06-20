import { NextResponse } from 'next/server';
import { startSearch } from '@/lib/api';

export async function POST(request) {
  try {
    const sessionCookie = request.headers.get('x-b2b-session-cookie')?.trim() || '';
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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
