import StreamersClient from '@/components/StreamersClient';
import { Streamer } from '@/types/streamer';

export default async function StreamersPage() {
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

  return <StreamersClient initialStreamers={initialStreamers} />;
}

