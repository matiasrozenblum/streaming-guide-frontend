import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://streaming-guide-backend-staging.up.railway.app';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/channels/categories-enabled`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add cache control for config values
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching categories enabled status:', error);
    // Default to false if there's an error
    return NextResponse.json({ categories_enabled: false });
  }
}
