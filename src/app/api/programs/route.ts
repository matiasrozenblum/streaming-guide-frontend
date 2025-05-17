import { NextRequest, NextResponse } from 'next/server';
import { requireAccessToken } from '@/utils/auth-server';

export async function GET(request: NextRequest) {
  try {
    const token = await requireAccessToken(request);
    
    if (!token) {
      console.error('No authentication token found');
      return NextResponse.json([], { status: 401 });
    }

    console.log('Making request to backend:', {
      url: `${process.env.NEXT_PUBLIC_API_URL}/programs`,
      token: token.substring(0, 10) + '...',
      headers: {
        'Authorization': `Bearer ${token.substring(0, 10)}...`
      }
    });
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/programs`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Backend error response:', {
        status: response.status,
        statusText: response.statusText,
        data: errorData,
        requestUrl: `${process.env.NEXT_PUBLIC_API_URL}/programs`,
        requestHeaders: {
          'Authorization': `Bearer ${token.substring(0, 10)}...`
        }
      });
      throw new Error(`Failed to fetch programs: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Backend programs response:', data);
    
    // Ensure we're returning an array
    if (!Array.isArray(data)) {
      console.error('Backend did not return an array:', data);
      return NextResponse.json([], { status: 200 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching programs:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await requireAccessToken(request);
    
    if (!token) {
      console.error('No authentication token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/programs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Backend error response:', {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      });
      throw new Error(`Failed to create program: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating program:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 