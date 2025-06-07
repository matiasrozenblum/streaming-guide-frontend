import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ua = req.headers.get('user-agent') || '';
  const isIOS = /iP(hone|od|ad)/i.test(ua);
  const isSafari = /^Mozilla\/.*AppleWebKit\/.*Safari\//.test(ua) && !/CriOS|FxiOS|OPiOS/.test(ua);
  const cookie = req.cookies.get('pwa_icon_prefetched')?.value;

  // 💡 Redirección fantasma solo si no se hizo antes
  if (pathname === '/' && isIOS && isSafari && !cookie) {
    const rewriteUrl = req.nextUrl.clone();
    rewriteUrl.pathname = '/index.html';

    const response = NextResponse.rewrite(rewriteUrl);
    // ⚠️ Este header hace que luego vuelva automáticamente a `/` sin que el usuario vea nada
    response.headers.set('Refresh', '0; url=/' );
    response.cookies.set('pwa_icon_prefetched', 'true', { path: '/', maxAge: 3600 });

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
