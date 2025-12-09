import { redirect } from 'next/navigation';
import StreamersClient from '@/components/StreamersClient';
import { Streamer } from '@/types/streamer';
import { Category } from '@/types/channel';

export default async function StreamersPage() {
  // Check if streamers are enabled
  let streamersEnabled = false; // Default to false for safety
  try {
    const configRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/config/streamers_enabled`,
      {
        cache: 'no-store',
      }
    );
    if (configRes.ok) {
      const value = await configRes.text();
      streamersEnabled = value === 'true';
    }
    // If config not found or error, keep default value (false) - safer for production
  } catch {
    // Default to false if config fetch fails - safer for production
  }

  // Redirect to home if streamers are disabled
  if (!streamersEnabled) {
    redirect('/');
  }

  let initialStreamers: Streamer[] = [];
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/streamers/visible`,
      {
        cache: 'no-store',
      }
    );
    if (res.ok) {
      const data = await res.json();
      initialStreamers = Array.isArray(data) ? data : [];
    }
  } catch {
    // fallback to empty streamers
  }

  let categories: Category[] = [];
  try {
    const categoriesRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/categories`,
      {
        next: { revalidate: 3600 } // Categories change less frequently
      }
    );
    if (categoriesRes.ok) {
      const data = await categoriesRes.json();
      categories = Array.isArray(data) ? data : [];
    }
  } catch {
    // fallback to empty categories
  }

  return <StreamersClient initialStreamers={initialStreamers} initialCategories={categories} streamersEnabled={streamersEnabled} />;
}

