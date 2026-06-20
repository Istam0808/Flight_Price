import { NextResponse } from 'next/server';
import { loginToB2B, setStoredB2BSessionCookie } from '@/lib/b2bAuth';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    const sessionCookie = await loginToB2B({ username, password });
    const response = NextResponse.json({ ok: true });

    setStoredB2BSessionCookie(response, sessionCookie);

    return response;
  } catch (err) {
    console.error('[/api/auth/login]', err);
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
