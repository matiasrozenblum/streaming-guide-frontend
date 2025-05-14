import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password, isBackoffice } = await request.json();
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login/legacy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password, isBackoffice }),
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
} 