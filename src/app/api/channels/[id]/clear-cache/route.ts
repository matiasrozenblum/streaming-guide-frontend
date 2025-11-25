import { NextRequest, NextResponse } from 'next/server';
import { requireAccessToken } from '@/utils/auth-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await requireAccessToken(request);
    const { id } = await params;
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/channels/${id}/clear-cache`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Backend error:', {
        status: response.status,
        errorData,
      });
      throw new Error(`Failed to clear cache: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to clear cache',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

