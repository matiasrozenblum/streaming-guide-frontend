import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params;
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/channels/${id}`;

    const cookieHeader = request.headers.get('cookie');
    const cookies = cookieHeader ? cookieHeader.split(';') : [];
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('backoffice_token='));
    const token = tokenCookie?.split('=')[1];

    const response = await fetch(apiUrl, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Backend error:', {
        status: response.status,
        errorData,
      });
      throw new Error(`Failed to update channel: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to update channel',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const cookies = cookieHeader ? cookieHeader.split(';') : [];
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('backoffice_token='));
    const token = tokenCookie?.split('=')[1];

    const { id } = await params;
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/channels/${id}`;
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete channel: ${response.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting channel:', error);
    return NextResponse.json({ error: 'Failed to delete channel' }, { status: 500 });
  }
} 