import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      registration_token, 
      firstName, 
      lastName, 
      gender, 
      birthDate, 
      password,
      deviceId 
    } = body;

    // Validate required fields
    if (!registration_token || !firstName || !lastName || !gender || !birthDate || !password) {
      return NextResponse.json(
        { message: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    // Call backend endpoint
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/complete-profile`;
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': request.headers.get('user-agent') || 'Unknown'
      },
      body: JSON.stringify({
        registration_token,
        firstName,
        lastName,
        gender,
        birthDate,
        password,
        deviceId,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(
        { message: errorData.message || 'Error al completar el perfil' },
        { status: res.status }
      );
    }

    const data = await res.json();
    
    // Return the backend response with tokens
    return NextResponse.json(data);

  } catch (error) {
    console.error('Complete profile error:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 