import { signIn } from 'next-auth/react';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    // Call backend login endpoint
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      throw new Error('Invalid credentials');
    }
    const data = await res.json();
    // Use the access_token to sign in
    const response = await signIn('credentials', { redirect: false, accessToken: data.access_token, refreshToken: data.refresh_token });
    if (!response) {
      throw new Error('Invalid credentials');
    }
    return NextResponse.json(response);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
} 