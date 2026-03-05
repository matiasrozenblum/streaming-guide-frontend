import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SubscriptionsClient, { UserSubscription } from '@/components/SubscriptionsClient';
import { Streamer } from '@/types/streamer';

export default async function SubscriptionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !session.user.id) {
    redirect('/');
  }

  let initialSubscriptions: UserSubscription[] = [];
  let initialStreamerSubscriptions: Streamer[] = []; // Streamer[] type

  try {
    // 1. Fetch program subscriptions
    const subsRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/subscriptions`,
      {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: 'no-store',
      }
    );
    if (subsRes.ok) {
      const data = await subsRes.json();
      initialSubscriptions = data.subscriptions || [];
    }

    // 2. Fetch all streamers (to get details)
    const streamersRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/streamers/visible`,
      { cache: 'no-store' }
    );
    const allStreamers = streamersRes.ok ? await streamersRes.json() : [];

    // 3. Fetch user's subscribed streamer IDs
    const streamerSubsRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/streamers/subscriptions/my`,
      {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: 'no-store',
      }
    );
    const subscribedStreamerIds = streamerSubsRes.ok ? await streamerSubsRes.json() : [];

    // 4. Filter streamers to get only subscribed ones
    initialStreamerSubscriptions = allStreamers.filter((s: Streamer) =>
      subscribedStreamerIds.includes(s.id)
    ).map((s: Streamer) => ({ ...s, is_subscribed: true }));

  } catch (error) {
    console.error('Error fetching data for subscriptions page:', error);
    // fallback to empty
  }

  return (
    <SubscriptionsClient
      initialSubscriptions={initialSubscriptions}
      initialStreamerSubscriptions={initialStreamerSubscriptions}
    />
  );
} 