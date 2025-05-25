import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { identifier } = await request.json();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/send-code`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    }
  );
  if (!res.ok) {
    return NextResponse.json(await res.json(), { status: res.status });
  }
  return NextResponse.json(await res.json());
}