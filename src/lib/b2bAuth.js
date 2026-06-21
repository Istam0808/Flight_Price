const APP_SESSION_COOKIE = 'luminara_b2b_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function getLoginUrl() {
  if (process.env.B2B_LOGIN_URL) {
    return process.env.B2B_LOGIN_URL;
  }

  if (!process.env.B2B_API_URL) {
    throw new Error('Не настроен B2B_LOGIN_URL или B2B_API_URL');
  }

  return new URL(process.env.B2B_LOGIN_PATH || '/login', process.env.B2B_API_URL).toString();
}

function getLoginBody(username, password, hiddenFields = {}) {
  const usernameField = process.env.B2B_LOGIN_USERNAME_FIELD || 'login';
  const passwordField = process.env.B2B_LOGIN_PASSWORD_FIELD || 'password';

  const body = new URLSearchParams();

  Object.entries(hiddenFields).forEach(([key, value]) => {
    body.set(key, String(value));
  });
  Object.entries(parseExtraLoginBody()).forEach(([key, value]) => {
    body.set(key, String(value));
  });
  body.set(usernameField, username);
  body.set(passwordField, password);

  return body;
}

function parseExtraLoginBody() {
  const raw = process.env.B2B_LOGIN_EXTRA_BODY;

  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    throw new Error('B2B_LOGIN_EXTRA_BODY должен быть валидным JSON объектом');
  }
}

function extractSetCookies(headers) {
  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie();
  }

  const combinedCookie = headers.get('set-cookie');

  if (!combinedCookie) {
    return [];
  }

  return combinedCookie.split(/,(?=\s*[^;,=\s]+=[^;,]+)/);
}

function setCookieToRequestCookie(setCookie) {
  const [cookiePair, ...attributes] = setCookie.split(';');
  const normalizedAttributes = attributes.map((attribute) => attribute.trim().toLowerCase());
  const separatorIndex = cookiePair.indexOf('=');

  if (separatorIndex === -1) {
    return '';
  }

  const name = cookiePair.slice(0, separatorIndex).trim();
  const value = cookiePair.slice(separatorIndex + 1).trim();

  if (!name || value === 'deleted' || normalizedAttributes.includes('max-age=0')) {
    return '';
  }

  return `${name}=${value}`;
}

function extractCookieHeader(headers) {
  return extractSetCookies(headers)
    .map(setCookieToRequestCookie)
    .filter(Boolean)
    .join('; ');
}

function mergeCookieHeaders(...cookieHeaders) {
  const cookies = new Map();

  cookieHeaders
    .filter(Boolean)
    .flatMap((cookieHeader) => cookieHeader.split(/;\s*/))
    .forEach((cookiePair) => {
      const separatorIndex = cookiePair.indexOf('=');

      if (separatorIndex === -1) {
        return;
      }

      const name = cookiePair.slice(0, separatorIndex).trim();
      const value = cookiePair.slice(separatorIndex + 1).trim();

      if (name && value) {
        cookies.set(name, value);
      }
    });

  return Array.from(cookies.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

function decodeHtmlValue(value = '') {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function getAttributeValue(input, attribute) {
  const pattern = new RegExp(`${attribute}\\s*=\\s*(['"])(.*?)\\1`, 'i');
  return input.match(pattern)?.[2] || '';
}

function extractHiddenFields(html) {
  const fields = {};
  const inputs = html.match(/<input\b[^>]*>/gi) || [];

  inputs.forEach((input) => {
    const type = getAttributeValue(input, 'type').toLowerCase();
    const name = getAttributeValue(input, 'name');

    if (type === 'hidden' && name) {
      fields[decodeHtmlValue(name)] = decodeHtmlValue(getAttributeValue(input, 'value'));
    }
  });

  return fields;
}

function getCommonB2BHeaders() {
  const headers = {
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  if (process.env.B2B_TOKEN) {
    headers.Authorization = `Bearer ${process.env.B2B_TOKEN}`;
  }

  if (process.env.B2B_ETM_AUTH_KEY) {
    headers['etm-auth-key'] = process.env.B2B_ETM_AUTH_KEY;
  }

  return headers;
}

async function extractErrorMessage(response) {
  try {
    const text = await response.text();

    if (!text) {
      return '';
    }

    try {
      const data = JSON.parse(text);
      return data.message || data.error || text;
    } catch {
      return text;
    }
  } catch {
    return '';
  }
}

export function getStoredB2BSessionCookie(request) {
  const stored = request.cookies.get(APP_SESSION_COOKIE)?.value;

  if (!stored) {
    return '';
  }

  try {
    return decodeURIComponent(stored);
  } catch {
    return '';
  }
}

export function setStoredB2BSessionCookie(response, sessionCookie) {
  response.cookies.set(APP_SESSION_COOKIE, encodeURIComponent(sessionCookie), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearStoredB2BSessionCookie(response) {
  response.cookies.set(APP_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

async function loadB2BLoginPage() {
  const response = await fetch(getLoginUrl(), {
    method: 'GET',
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    redirect: 'manual',
  });
  const cookieHeader = extractCookieHeader(response.headers);
  const html = await response.text().catch(() => '');

  return {
    cookieHeader,
    hiddenFields: html ? extractHiddenFields(html) : {},
  };
}

export async function loginToB2B({ username, password }) {
  const normalizedUsername = String(username || '').trim();
  const normalizedPassword = String(password || '');

  if (!normalizedUsername || !normalizedPassword) {
    throw new Error('Введите логин и пароль B2B');
  }

  const loginPage = await loadB2BLoginPage().catch(() => ({
    cookieHeader: '',
    hiddenFields: {},
  }));
  const headers = getCommonB2BHeaders();

  if (loginPage.cookieHeader) {
    headers.Cookie = loginPage.cookieHeader;
  }

  const response = await fetch(getLoginUrl(), {
    method: 'POST',
    headers,
    body: getLoginBody(normalizedUsername, normalizedPassword, loginPage.hiddenFields),
    redirect: 'manual',
  });

  const sessionCookie = mergeCookieHeaders(loginPage.cookieHeader, extractCookieHeader(response.headers));

  if (!response.ok && !sessionCookie) {
    const details = await extractErrorMessage(response);
    throw new Error(`B2B login failed: ${response.status}${details ? ` - ${details}` : ''}`);
  }

  if (!sessionCookie) {
    throw new Error('B2B не вернул Set-Cookie после login-запроса');
  }

  return sessionCookie;
}
