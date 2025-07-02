import { NextRequest, NextResponse } from 'next/server';
import { requireAccessToken } from '@/utils/auth-server';

export async function GET(request: NextRequest) {
  const token = await requireAccessToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/programs`;
  const res = await fetch(backendUrl, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: NextRequest) {
  try {
    const token = await requireAccessToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/programs`;
    const body = await request.json();
    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 