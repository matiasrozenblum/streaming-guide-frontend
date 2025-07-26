import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/users/social-upsert`;
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to upsert user', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 