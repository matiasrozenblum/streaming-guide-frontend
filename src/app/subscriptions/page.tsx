import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import SubscriptionsClient, { UserSubscription } from '@/components/SubscriptionsClient';

export default async function SubscriptionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    // Not authenticated, let the client handle redirect
    return null;
  }

  let initialSubscriptions: UserSubscription[] = [];
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/subscriptions`,
      {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: 'no-store',
      }
    );
    if (res.ok) {
      const data = await res.json();
      initialSubscriptions = data.subscriptions || [];
    }
  } catch {
    // fallback to empty subscriptions
  }

  return <SubscriptionsClient initialSubscriptions={initialSubscriptions} />;
} 