import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ua = req.headers.get('user-agent') || '';
  const isIOS = /iP(hone|od|ad)/i.test(ua);
  const isSafari = /^Mozilla\/.*AppleWebKit\/.*Safari\//.test(ua) && !/CriOS|FxiOS|OPiOS/.test(ua);
  const hasPrefetchCookie = req.cookies.get('pwa_prefetched')?.value;

  // 👉 Redirigir a /index.html solo 1 vez en Safari iOS
  if (pathname === '/' && isIOS && isSafari && !hasPrefetchCookie) {
    const url = req.nextUrl.clone();
    url.pathname = '/index.html';

    const response = NextResponse.rewrite(url);
    response.cookies.set('pwa_prefetched', 'true', {
      path: '/',
      maxAge: 60 * 5, // 5 minutos
    });

    return response;
  }

  // 🔐 Protege el backoffice
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (pathname.startsWith('/backoffice')) {
    if (!token || token.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/backoffice/:path*'],
};
