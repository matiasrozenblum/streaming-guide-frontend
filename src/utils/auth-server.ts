import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const SECRET = process.env.NEXTAUTH_SECRET!

/**
 * Extrae el accessToken que guardaste en el callback de Session.
 * Si no existe, arroja un NextResponse con 401.
 */
export async function requireAccessToken(req: NextRequest): Promise<string> {
  const nextAuthToken = await getToken({ req, secret: SECRET })
  if (!nextAuthToken?.accessToken) {
    throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return nextAuthToken.accessToken as string
}

/**
 * The same token, but also accepting the backend JWT straight off an
 * `Authorization` header — which is what the native apps carry, since they
 * sign in against the backend and never hold a NextAuth cookie.
 *
 * This grants nothing extra: the token is handed to the backend unchanged and
 * the backend scopes the response to whoever it belongs to, so a caller can
 * only reach data it could already reach by calling the backend itself.
 */
export async function requireAccessTokenOrBearer(
  req: NextRequest,
): Promise<string> {
  const header = req.headers.get('authorization')
  const bearer = header?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim()
  if (bearer) return bearer
  return requireAccessToken(req)
}