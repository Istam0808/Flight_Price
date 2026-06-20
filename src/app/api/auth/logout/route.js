import { NextResponse } from 'next/server';
import { clearStoredB2BSessionCookie } from '@/lib/b2bAuth';

export async function POST() {
  const response = NextResponse.json({ ok: true });

  clearStoredB2BSessionCookie(response);

  return response;
}
