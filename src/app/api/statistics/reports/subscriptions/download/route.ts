import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const params = url.searchParams.toString();
  const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/statistics/reports/subscriptions/download?${params}`;
  
  try {
    const res = await fetch(backendUrl, {
      headers: {
        // Add auth headers if needed
      },
    });
    
    if (!res.ok) {
      throw new Error(`Backend error: ${res.status}`);
    }
    
    const blob = await res.blob();
    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = res.headers.get('content-disposition') || 'attachment';
    
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
      },
    });
  } catch (error) {
    console.error('Error downloading subscriptions report:', error);
    return NextResponse.json({ error: 'Error downloading report' }, { status: 500 });
  }
} 