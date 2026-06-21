import { decodeProtectedHeader, importX509, jwtVerify } from 'jose';
import { NextResponse } from 'next/server';

const APP_SESSION_COOKIE = 'luminara_app_session';
const B2B_LOGIN_PATH = '/b2b-login';
const FIREBASE_SESSION_CERTS_URL = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys';

let cachedCerts = null;
let cachedCertsExpiresAt = 0;

function isPublicPath(pathname) {
  return (
    pathname === '/login' ||
    pathname === B2B_LOGIN_PATH ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/logout') ||
    pathname.startsWith('/api/auth/status') ||
    pathname.startsWith('/api/auth/session') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/img') ||
    pathname === '/favicon.ico' ||
    /\.[a-z0-9]+$/i.test(pathname)
  );
}

function getB2BLoginRedirect(request) {
  const loginUrl = new URL(B2B_LOGIN_PATH, request.url);
  loginUrl.search = request.nextUrl.search;

  return NextResponse.redirect(loginUrl);
}

function getLoginRedirect(request) {
  const loginUrl = new URL('/login', request.url);
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  if (nextPath && nextPath !== '/login') {
    loginUrl.searchParams.set('next', nextPath);
  }

  return NextResponse.redirect(loginUrl);
}

function getUnauthorizedResponse() {
  return NextResponse.json({ error: 'Требуется вход в систему' }, { status: 401 });
}

async function verifySessionCookie(sessionCookie) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID не настроен');
  }

  const { kid } = decodeProtectedHeader(sessionCookie);
  const publicKey = await getFirebaseSessionPublicKey(kid);

  await jwtVerify(sessionCookie, publicKey, {
    algorithms: ['RS256'],
    audience: projectId,
    issuer: `https://session.firebase.google.com/${projectId}`,
  });
}

async function getFirebaseSessionPublicKey(kid) {
  if (!kid) {
    throw new Error('Firebase session cookie не содержит kid');
  }

  if (!cachedCerts || Date.now() >= cachedCertsExpiresAt) {
    const response = await fetch(FIREBASE_SESSION_CERTS_URL);

    if (!response.ok) {
      throw new Error('Не удалось загрузить Firebase public keys');
    }

    const cacheControl = response.headers.get('cache-control') || '';
    const maxAge = Number(cacheControl.match(/max-age=(\d+)/)?.[1] || 300);

    cachedCerts = await response.json();
    cachedCertsExpiresAt = Date.now() + maxAge * 1000;
  }

  const certificate = cachedCerts[kid];

  if (!certificate) {
    cachedCerts = null;
    throw new Error('Firebase public key для session cookie не найден');
  }

  return importX509(certificate, 'RS256');
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  if (pathname.toLowerCase() === B2B_LOGIN_PATH && pathname !== B2B_LOGIN_PATH) {
    return getB2BLoginRedirect(request);
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(APP_SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    return pathname.startsWith('/api/') ? getUnauthorizedResponse() : getLoginRedirect(request);
  }

  try {
    await verifySessionCookie(sessionCookie);
    return NextResponse.next();
  } catch {
    return pathname.startsWith('/api/') ? getUnauthorizedResponse() : getLoginRedirect(request);
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
