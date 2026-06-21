import { NextResponse } from 'next/server';
import {
  APP_SESSION_COOKIE,
  APP_SESSION_ID_COOKIE,
  clearActiveAppSession,
  clearAppSessionCookies,
  createAppSession,
  getUserFromRequest,
  setAppSessionCookies,
} from '@/lib/firebase/session';

function getSessionCookiePair(request) {
  return {
    sessionCookie: request.cookies.get(APP_SESSION_COOKIE)?.value || '',
    sessionId: request.cookies.get(APP_SESSION_ID_COOKIE)?.value || '',
  };
}

export async function GET(request) {
  const user = await getUserFromRequest(request);

  return NextResponse.json({
    authenticated: Boolean(user),
    user: user ? { uid: user.uid, email: user.email } : null,
  });
}

export async function POST(request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'Firebase ID token обязателен' }, { status: 400 });
    }

    const { sessionCookie, sessionId, user, expiresAtMillis } = await createAppSession(idToken);
    const response = NextResponse.json({ ok: true, user, expiresAtMillis });

    setAppSessionCookies(response, sessionCookie, sessionId);

    return response;
  } catch (err) {
    console.error('[/api/auth/session]', err);
    const isActiveSession = err.code === 'auth/session-already-active';

    return NextResponse.json(
      { error: err.message || 'Не удалось создать сессию' },
      { status: isActiveSession ? 409 : 401 },
    );
  }
}

export async function DELETE(request) {
  const { sessionCookie, sessionId } = getSessionCookiePair(request);
  const response = NextResponse.json({ ok: true });

  await clearActiveAppSession(sessionCookie, sessionId);
  clearAppSessionCookies(response);

  return response;
}
