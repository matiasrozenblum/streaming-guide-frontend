import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/streamers/visible`;
    const res = await fetch(backendUrl, {
      cache: 'no-store',
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch visible streamers');
    }
    
    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching visible streamers:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch visible streamers',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

