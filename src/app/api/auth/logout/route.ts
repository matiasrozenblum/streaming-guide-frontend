import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Clear the refresh token cookie
  response.cookies.delete('refresh_token');
  
  return response;
} 