import { NextRequest, NextResponse } from 'next/server';
import { requireAccessToken } from '@/utils/auth-server';

export async function GET(request: NextRequest) {
  try {
    const token = await requireAccessToken(request);
    
    if (!token) {
      console.error('No authentication token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/statistics/demographics`, {
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
        requestUrl: `${process.env.NEXT_PUBLIC_API_URL}/statistics/demographics`,
        requestHeaders: {
          'Authorization': `Bearer ${token.substring(0, 10)}...`
        }
      });
      throw new Error(`Failed to fetch demographics: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching demographics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 