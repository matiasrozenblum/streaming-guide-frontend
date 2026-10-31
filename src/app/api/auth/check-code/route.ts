import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Validates an OTP without consuming it (used by the forgot-password flow
// before asking for the new password; reset-password consumes it later).
export async function POST(request: NextRequest) {
  try {
    const { identifier, code } = await request.json();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, code }),
    });
    const payload = await res.json().catch(() => ({}));
    return NextResponse.json(payload, { status: res.status });
  } catch (error) {
    console.error('Error checking code:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
