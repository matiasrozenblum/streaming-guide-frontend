import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { registration_token, firstName, lastName, password, deviceId } = await request.json();
  
  // Forward the user-agent header from the original request
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  
  console.log('🔍 [API] register called with:', {
    hasRegistrationToken: !!registration_token,
    firstName,
    lastName,
    deviceId,
    userAgent,
    timestamp: new Date().toISOString()
  });
  
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
    {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': userAgent,
      },
      body: JSON.stringify({ registration_token, firstName, lastName, password, deviceId }),
    }
  );
  const payload = await res.json();
  
  console.log('✅ [API] register response:', { 
    status: res.status, 
    hasAccessToken: !!payload.access_token,
    hasDeviceId: !!payload.deviceId 
  });
  
  if (!res.ok) {
    return NextResponse.json(payload, { status: res.status });
  }
  // payload: { access_token }
  const response = NextResponse.json(payload);
  // clear registration_token
  response.cookies.delete({ name: 'registration_token', path: '/' });
  return response;
}