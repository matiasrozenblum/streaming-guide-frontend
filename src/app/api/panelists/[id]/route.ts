import { NextRequest, NextResponse } from 'next/server';
import { requireAccessToken } from '@/utils/auth-server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await requireAccessToken(request);

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;

  try {
    const body = await request.json();
    console.log('[PATCH /api/panelists/[id]] Incoming body:', body);
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/panelists/${id}`;
    const backendReqBody = JSON.stringify(body);
    console.log('[PATCH /api/panelists/[id]] Forwarding to backend:', backendUrl);
    console.log('[PATCH /api/panelists/[id]] Backend request body:', backendReqBody);
    const response = await fetch(backendUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: backendReqBody,
    });
    console.log('[PATCH /api/panelists/[id]] Backend response status:', response.status);
    let data;
    try {
      data = await response.json();
      console.log('[PATCH /api/panelists/[id]] Backend response body:', data);
    } catch {
      data = null;
      console.log('[PATCH /api/panelists/[id]] Backend response body: <not JSON>');
    }
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to update panelist', backendStatus: response.status, backendBody: data }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating panelist:', error);
    return NextResponse.json({ error: 'Failed to update panelist', details: error instanceof Error ? error.message : error }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await requireAccessToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/panelists/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete panelist');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting panelist:', error);
    return NextResponse.json({ error: 'Failed to delete panelist' }, { status: 500 });
  }
} 