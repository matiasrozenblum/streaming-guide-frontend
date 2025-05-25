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