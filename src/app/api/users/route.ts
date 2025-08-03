import { NextRequest, NextResponse } from 'next/server';
import { requireAccessToken } from '@/utils/auth-server';

export async function GET(request: NextRequest) {
  try {
    const token = await requireAccessToken(request);
    
    if (!token) {
      console.error('No authentication token found');
      return NextResponse.json([], { status: 401 });
    }

    // Get pagination parameters from URL
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '20';

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users?page=${page}&pageSize=${pageSize}`, {
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
        requestUrl: `${process.env.NEXT_PUBLIC_API_URL}/users?page=${page}&pageSize=${pageSize}`,
        requestHeaders: {
          'Authorization': `Bearer ${token.substring(0, 10)}...`
        }
      });
      throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Return the paginated response structure
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ users: [], total: 0, page: 1, pageSize: 20 }, { status: 500 });
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
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
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
      throw new Error(`Failed to create user: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}