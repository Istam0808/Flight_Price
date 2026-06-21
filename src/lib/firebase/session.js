import 'server-only';

import { FieldValue } from 'firebase-admin/firestore';
import { getFirebaseAdminAuth, getFirebaseAdminDb } from './admin';

export const APP_SESSION_COOKIE = 'luminara_app_session';
export const APP_SESSION_ID_COOKIE = 'luminara_app_session_id';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

const SESSION_COLLECTION = 'authSessions';
const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;

function getCookieOptions(maxAge) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  };
}

function getExpiresAtMillis() {
  return Date.now() + SESSION_MAX_AGE_MS;
}

function getSessionRef(uid) {
  return getFirebaseAdminDb().collection(SESSION_COLLECTION).doc(uid);
}

export function setAppSessionCookies(response, sessionCookie, sessionId) {
  response.cookies.set(APP_SESSION_COOKIE, sessionCookie, getCookieOptions(SESSION_MAX_AGE_SECONDS));
  response.cookies.set(APP_SESSION_ID_COOKIE, sessionId, getCookieOptions(SESSION_MAX_AGE_SECONDS));
}

export function clearAppSessionCookies(response) {
  response.cookies.set(APP_SESSION_COOKIE, '', getCookieOptions(0));
  response.cookies.set(APP_SESSION_ID_COOKIE, '', getCookieOptions(0));
}

export async function createAppSession(idToken) {
  const auth = getFirebaseAdminAuth();
  const decodedToken = await auth.verifyIdToken(idToken);
  const sessionId = crypto.randomUUID();
  const expiresAtMillis = getExpiresAtMillis();
  const sessionRef = getSessionRef(decodedToken.uid);

  await getFirebaseAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(sessionRef);
    const activeSession = snapshot.exists ? snapshot.data() : null;
    const activeExpiresAt = Number(activeSession?.expiresAtMillis || 0);

    if (activeSession?.sessionId && activeExpiresAt > Date.now()) {
      const error = new Error('Этот аккаунт уже используется в другой активной сессии.');
      error.code = 'auth/session-already-active';
      throw error;
    }

    transaction.set(sessionRef, {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      sessionId,
      expiresAtMillis,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_MS,
  });

  return {
    sessionCookie,
    sessionId,
    expiresAtMillis,
    user: {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
    },
  };
}

export async function verifyAppSession(sessionCookie, sessionId) {
  if (!sessionCookie || !sessionId) {
    return null;
  }

  const decodedClaims = await getFirebaseAdminAuth().verifySessionCookie(sessionCookie, true);
  const snapshot = await getSessionRef(decodedClaims.uid).get();

  if (!snapshot.exists) {
    return null;
  }

  const activeSession = snapshot.data();

  if (activeSession.sessionId !== sessionId || Number(activeSession.expiresAtMillis || 0) <= Date.now()) {
    return null;
  }

  return {
    uid: decodedClaims.uid,
    email: decodedClaims.email || activeSession.email || '',
    claims: decodedClaims,
  };
}

export async function clearActiveAppSession(sessionCookie, sessionId) {
  const user = await verifyAppSession(sessionCookie, sessionId).catch(() => null);

  if (!user) {
    return;
  }

  const sessionRef = getSessionRef(user.uid);

  await getFirebaseAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(sessionRef);
    const activeSession = snapshot.exists ? snapshot.data() : null;

    if (activeSession?.sessionId === sessionId) {
      transaction.delete(sessionRef);
    }
  });
}

export async function getUserFromRequest(request) {
  const sessionCookie = request.cookies.get(APP_SESSION_COOKIE)?.value || '';
  const sessionId = request.cookies.get(APP_SESSION_ID_COOKIE)?.value || '';

  return verifyAppSession(sessionCookie, sessionId).catch(() => null);
}
