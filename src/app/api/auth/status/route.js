import { NextResponse } from 'next/server';
import { getStoredB2BSessionCookie } from '@/lib/b2bAuth';

export async function GET(request) {
  return NextResponse.json({
    authenticated: Boolean(getStoredB2BSessionCookie(request)),
  });
}
