import StreamersClient from '@/components/StreamersClient';

export default async function StreamersPage() {
  // TODO: Replace with actual API call when backend is ready
  // const session = await getServerSession(authOptions);
  // let initialStreamers: Streamer[] = [];
  // try {
  //   const res = await fetch(
  //     `${process.env.NEXT_PUBLIC_API_URL}/streamers`,
  //     {
  //       headers: { Authorization: `Bearer ${session?.accessToken}` },
  //       cache: 'no-store',
  //     }
  //   );
  //   if (res.ok) {
  //     const data = await res.json();
  //     initialStreamers = data.streamers || [];
  //   }
  // } catch {
  //   // fallback to empty streamers
  // }

  return <StreamersClient />;
}

