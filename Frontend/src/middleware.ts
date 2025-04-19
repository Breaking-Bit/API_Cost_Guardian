import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_CONFIG } from './config/env';

export function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_CONFIG.TOKEN_KEY);
  const isAuthPage = request.nextUrl.pathname === '/';
  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard');

  if (!token && isDashboardPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],
};