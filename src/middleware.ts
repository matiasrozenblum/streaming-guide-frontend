import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  // extrae el JWT de next-auth
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl

  // Raíz pública (“/”): requiere al menos sesión legacy o user
  if (pathname === '/') {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // Backoffice: sólo role=admin (o como lo definas tú)
  if (pathname.startsWith('/backoffice')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    if (token.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/backoffice/:path*'],
}