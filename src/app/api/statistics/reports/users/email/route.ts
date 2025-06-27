import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const params = url.searchParams.toString();
  const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/statistics/reports/users/email?${params}`;
  
  try {
    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add auth headers if needed
      },
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `Backend error: ${res.status}`);
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error emailing users report:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error sending report' }, 
      { status: 500 }
    );
  }
} 