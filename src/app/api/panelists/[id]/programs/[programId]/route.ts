import { requireAccessToken } from '@/utils/auth-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; programId: string }> }
) {
  const token = await requireAccessToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, programId } = await params;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/panelists/${id}/programs/${programId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Backend error:', error);
      throw new Error(error.message || 'Failed to add panelist to program');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding panelist to program:', error);
    return NextResponse.json({ error: 'Failed to add panelist to program' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; programId: string }> }
) {
  const token = await requireAccessToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, programId } = await params;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/panelists/${id}/programs/${programId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Backend error:', error);
      throw new Error(error.message || 'Failed to remove panelist from program');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing panelist from program:', error);
    return NextResponse.json({ error: 'Failed to remove panelist from program' }, { status: 500 });
  }
}
