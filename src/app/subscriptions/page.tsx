import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SubscriptionsClient, { UserSubscription } from '@/components/SubscriptionsClient';

export default async function SubscriptionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !session.user.id) {
    redirect('/');
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