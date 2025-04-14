import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; programId: string }> }
) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id, programId } = await params;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/panelists/${id}/programs/${programId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
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
  request: Request,
  { params }: { params: { id: string; programId: string } }
) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/panelists/${params.id}/programs/${params.programId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': authHeader,
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