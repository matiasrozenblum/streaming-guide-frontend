import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (password !== process.env.GRID_PASSWORD) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid password' }),
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });
    
    response.cookies.set({
      name: 'isAuthenticated',
      value: 'true',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return response;
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
} 