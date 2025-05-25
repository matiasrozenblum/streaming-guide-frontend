import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { identifier, code, deviceId } = await request.json();
  
  // Forward the user-agent header from the original request
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  
  console.log('🔍 [API] verify-code called with:', {
    identifier,
    deviceId,
    userAgent,
    timestamp: new Date().toISOString()
  });
  
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-code`,
    {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': userAgent,
      },
      body: JSON.stringify({ identifier, code, deviceId }),
    }
  );

  const payload = await res.json();
  console.log('✅ [API] verify-code response:', { 
    status: res.status, 
    isNew: payload.isNew,
    hasDeviceId: !!payload.deviceId 
  });
  
  if (!res.ok) {
    return NextResponse.json(payload, { status: res.status });
  }

  // payload: { access_token?, registration_token?, isNew: boolean }
  const response = NextResponse.json(payload);
  // Store registration_token for new users
  if (payload.registration_token) {
    response.cookies.set({
      name: 'registration_token',
      value: payload.registration_token,
      path: '/',
      sameSite: 'strict',
    });
  }
  return response;
}