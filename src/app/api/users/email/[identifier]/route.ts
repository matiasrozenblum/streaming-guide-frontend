import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {

    const { identifier } = await params;
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/email/${identifier}`);

    if (response.status === 404) {
      return NextResponse.json({ exists: false });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Backend error response:', {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      });
      throw new Error(`Failed to check email: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json({ ...data, exists: true });
  } catch (error) {
    console.error('Error checking email:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 