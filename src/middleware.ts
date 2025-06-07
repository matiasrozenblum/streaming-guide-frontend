import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Redirección especial para Safari en iOS
  const ua = req.headers.get('user-agent') || '';
  const isIOS = /iP(hone|od|ad)/i.test(ua);
  const isSafari = /^Mozilla\/.*AppleWebKit\/.*Safari\//.test(ua) && !/CriOS|FxiOS|OPiOS/.test(ua);

  if (pathname === '/' && isIOS && isSafari) {
    const url = req.nextUrl.clone();
    url.pathname = '/index.html';
    return NextResponse.rewrite(url);
  }

  // 2. Protección del backoffice (solo admin)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (pathname.startsWith('/backoffice')) {
    if (!token || token.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

// Aplica tanto al backoffice como a la raíz
export const config = {
  matcher: ['/', '/backoffice/:path*'],
};
