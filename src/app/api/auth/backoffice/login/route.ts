import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/login`;
    
    console.log('Backoffice login request:', { 
      password,
      apiUrl,
      env: process.env.NEXT_PUBLIC_API_URL
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password, isBackoffice: true }),
    });

    console.log('Backend response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Could not parse error response' }));
      console.error('Backend error:', errorData);
      throw new Error('Invalid credentials');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
} 