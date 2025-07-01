import { NextRequest, NextResponse } from 'next/server';
import { requireAccessToken } from '@/utils/auth-server';

export async function GET(request: NextRequest) {
  try {
    const token = await requireAccessToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { search } = new URL(request.url);
    const backendUrl = `${process.env.REPORTS_SERVICE_URL}/reports/top-channels${search}`;
    const response = await fetch(backendUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying top-channels:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 