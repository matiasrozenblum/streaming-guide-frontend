import { signIn } from 'next-auth/react';
import { NextResponse } from 'next/server';


export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    const response = await signIn('credentials', { redirect: false, password, isBackoffice: true })

    if (!response) {
      throw new Error('Invalid credentials');
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
} 