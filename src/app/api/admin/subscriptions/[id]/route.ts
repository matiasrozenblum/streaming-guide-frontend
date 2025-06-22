import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req });
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  
  try {
    const body = req.method === 'PATCH' ? await req.json() : undefined;

    const response = await fetch(`${BACKEND_URL}/admin/subscriptions/${id}`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.accessToken}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    
    if (req.method === 'DELETE') {
        return new NextResponse(null, { status: 204 });
    }

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Request failed' },
        { status: response.status }
      );
    }
    
    return NextResponse.json(data);

  } catch (error) {
    console.error(`Error in /api/admin/subscriptions/${id}:`, error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export { handler as PATCH, handler as DELETE }; 