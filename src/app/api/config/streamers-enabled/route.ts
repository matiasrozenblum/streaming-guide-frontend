import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/config/streamers_enabled`, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      // If config doesn't exist or error, return false
      return NextResponse.json({ streamersEnabled: false });
    }

    const value = await response.text();
    const trimmedValue = value?.trim();
    const streamersEnabled = trimmedValue === 'true';

    return NextResponse.json({ streamersEnabled });
  } catch (error) {
    console.error('Error fetching streamers config:', error);
    // Return false on error
    return NextResponse.json({ streamersEnabled: false });
  }
}

