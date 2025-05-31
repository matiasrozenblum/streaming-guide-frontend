import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import HomeClient from '@/components/HomeClient';
import { ClientWrapper } from '@/components/ClientWrapper';
import type { ChannelWithSchedules } from '@/types/channel';
import { getBuenosAiresDayOfWeek } from '@/utils/date';

interface InitialData {
  holiday: boolean;
  todaySchedules: ChannelWithSchedules[];
  weekSchedules: ChannelWithSchedules[];
}

async function getInitialData(token: string): Promise<InitialData> {
  try {
    // Fetch holiday info
    const holidayPromise = fetch(`${process.env.NEXT_PUBLIC_API_URL}/holiday`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 }
    }).then(res => res.json());

    const today = getBuenosAiresDayOfWeek();

    const todayPromise = fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/channels/with-schedules?day=${today}&live_status=true`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 60 }
      }
    ).then(res => res.json());

    const weekPromise = fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/channels/with-schedules?live_status=true`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 60 }
      }
    ).then(res => res.json());

    const [holidayData, todaySchedules, weekSchedules] = await Promise.all([
      holidayPromise,
      todayPromise,
      weekPromise,
    ]);

    return {
      holiday: !!holidayData.holiday,
      todaySchedules: Array.isArray(todaySchedules) ? todaySchedules : [],
      weekSchedules: Array.isArray(weekSchedules) ? weekSchedules : [],
    };
  } catch (error) {
    return {
      holiday: false,
      todaySchedules: [],
      weekSchedules: [],
    };
  }
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.accessToken) {
    return null; // This will trigger the client-side redirect in HomeClient
  }

  const initialData = await getInitialData(session.accessToken);

  return (
    <ClientWrapper>
      <HomeClient initialData={initialData} />
    </ClientWrapper>
  );
}