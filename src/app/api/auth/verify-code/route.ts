import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { identifier, code } = await request.json();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-code`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, code }),
    }
  );

  const payload = await res.json();
  if (!res.ok) {
    return NextResponse.json(payload, { status: res.status });
  }

  // payload: { access_token?, registration_token?, isNew: boolean }
  const response = NextResponse.json(payload);
  // Store access_token if login
  if (payload.access_token) {
    response.cookies.set({
      name: 'public_token',
      value: payload.access_token,
      path: '/',
      sameSite: 'strict',
    });
  }
  // Store registration_token for new users
  if (payload.registration_token) {
    response.cookies.set({
      name: 'registration_token',
      value: payload.registration_token,
      path: '/',
      sameSite: 'strict',
    });
  }
  return response;
}