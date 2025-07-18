import { NextRequest, NextResponse } from 'next/server';
import { requireAccessToken } from '@/utils/auth-server';

export async function POST(req: NextRequest) {
  const token = await requireAccessToken(req);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/statistics/reports`;
  const body = await req.text();

  const backendRes = await fetch(backendUrl, {
    method: 'POST',
    headers: {
      'Content-Type': req.headers.get('content-type') || 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body,
  });

  const contentType = backendRes.headers.get('content-type') || '';
  const contentDisposition = backendRes.headers.get('content-disposition') || '';

  if (contentType.includes('application/pdf') || contentType.includes('csv')) {
    const buffer = await backendRes.arrayBuffer();
    return new NextResponse(Buffer.from(buffer), {
      status: backendRes.status,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
      },
    });
  } else {
    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  }
} 