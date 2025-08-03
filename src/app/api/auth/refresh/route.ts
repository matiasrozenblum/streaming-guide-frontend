import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Refresh failed: No authorization header');
      return NextResponse.json({ error: 'No refresh token provided' }, { status: 401 });
    }

    const refreshToken = authHeader.split(' ')[1];
    console.log('Attempting token refresh with backend...');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': request.headers.get('user-agent') || 'Unknown',
        'Authorization': `Bearer ${refreshToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend refresh failed:', response.status, errorText);
      throw new Error(`Failed to refresh token: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Token refresh successful');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json({ error: 'Failed to refresh token' }, { status: 401 });
  }
} 