import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  console.log('Middleware running for path:', request.nextUrl.pathname);
  console.log('All cookies:', request.cookies.getAll());
  
  const backofficeToken = request.cookies.get('backoffice_token');
  const publicToken = request.cookies.get('public_token');

  console.log('Auth check:', {
    path: request.nextUrl.pathname,
    hasBackofficeToken: !!backofficeToken,
    hasPublicToken: !!publicToken,
    backofficeToken: backofficeToken?.value?.substring(0, 10) + '...',
    publicToken: publicToken?.value?.substring(0, 10) + '...'
  });

  // Handle root path authentication
  if (request.nextUrl.pathname === '/') {
    if (!publicToken) {
      console.log('Redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Handle backoffice authentication
  if (request.nextUrl.pathname.startsWith('/backoffice')) {
    if (!backofficeToken) {
      console.log('Redirecting to backoffice login');
      return NextResponse.redirect(new URL('/backoffice_login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/backoffice/:path*'],
}; 