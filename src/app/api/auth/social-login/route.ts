import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, lastName, provider } = await request.json();
    
    console.log('[Social Login] Creating user with:', { email, firstName, lastName, provider });
    
    // Call backend to create user
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/social-login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': request.headers.get('user-agent') || 'Unknown',
      },
      body: JSON.stringify({ 
        email, 
        firstName, 
        lastName, 
        provider 
      }),
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      console.error('[Social Login] Backend error:', data);
      return NextResponse.json(data, { status: res.status });
    }
    
    console.log('[Social Login] Backend response:', data);
    
    // Return the backend response (should include user ID and tokens)
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Social Login] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 