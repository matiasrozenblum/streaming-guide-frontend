import { NextRequest, NextResponse } from 'next/server';
import { requireAccessToken } from '@/utils/auth-server';

export async function GET(request: NextRequest) {
  try {
    const token = await requireAccessToken(request);
    
    if (!token) {
      console.error('No authentication token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/statistics/top-programs?limit=${limit}`, {
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
        requestUrl: `${process.env.NEXT_PUBLIC_API_URL}/statistics/top-programs?limit=${limit}`,
        requestHeaders: {
          'Authorization': `Bearer ${token.substring(0, 10)}...`
        }
      });
      throw new Error(`Failed to fetch top programs: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching top programs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 