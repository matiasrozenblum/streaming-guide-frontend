import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/panelists`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch panelists');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching panelists:', error);
    return NextResponse.json({ error: 'Failed to fetch panelists' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/panelists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('Failed to create panelist');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating panelist:', error);
    return NextResponse.json({ error: 'Failed to create panelist' }, { status: 500 });
  }
} 