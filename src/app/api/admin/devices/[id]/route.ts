import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = await getToken({ req });
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  try {
    const response = await fetch(`${BACKEND_URL}/admin/devices/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { message: errorData.message || 'Failed to delete device' },
        { status: response.status }
      );
    }

    return NextResponse.json(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting device:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 