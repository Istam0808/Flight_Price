import 'server-only';

import { cookies } from 'next/headers';
import { APP_SESSION_COOKIE, APP_SESSION_ID_COOKIE, verifyAppSession } from './session';

export async function getUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(APP_SESSION_COOKIE)?.value || '';
  const sessionId = cookieStore.get(APP_SESSION_ID_COOKIE)?.value || '';

  return verifyAppSession(sessionCookie, sessionId).catch(() => null);
}
