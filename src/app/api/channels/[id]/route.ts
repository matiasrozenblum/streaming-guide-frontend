import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/channels/${params.id}`;
    
    console.log('API Request details:', {
      url: apiUrl,
      method: 'PATCH',
      body,
      params
    });
    
    const response = await fetch(apiUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Backend error response:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        url: apiUrl
      });
      throw new Error(`Failed to update channel: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating channel:', error);
    return NextResponse.json({ 
      error: 'Failed to update channel',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/channels/${params.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete channel');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting channel:', error);
    return NextResponse.json({ error: 'Failed to delete channel' }, { status: 500 });
  }
} 