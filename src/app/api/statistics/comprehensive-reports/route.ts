import { NextRequest, NextResponse } from 'next/server';
import { requireAccessToken } from '@/utils/auth-server';

export async function GET(req: NextRequest) {
  const token = await requireAccessToken(req);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path') || '';
  const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/statistics/comprehensive-reports${path}`;

  try {
    const response = await fetch(backendUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching comprehensive reports:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const token = await requireAccessToken(req);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path') || '';
  const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/statistics/comprehensive-reports${path}`;
  const body = await req.text();

  try {
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': req.headers.get('content-type') || 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body,
    });

    const contentType = response.headers.get('content-type') || '';
    const contentDisposition = response.headers.get('content-disposition') || '';

    if (contentType.includes('application/pdf') || contentType.includes('csv')) {
      const buffer = await response.arrayBuffer();
      return new NextResponse(Buffer.from(buffer), {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': contentDisposition,
        },
      });
    } else {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }
  } catch (error) {
    console.error('Error with comprehensive reports:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 