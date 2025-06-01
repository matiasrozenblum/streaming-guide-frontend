import HomeClient from '@/components/HomeClient';
import { ClientWrapper } from '@/components/ClientWrapper';
import type { ChannelWithSchedules } from '@/types/channel';
import { getBuenosAiresDayOfWeek } from '@/utils/date';

interface InitialData {
  holiday: boolean;
  todaySchedules: ChannelWithSchedules[];
  weekSchedules: ChannelWithSchedules[];
}

async function getInitialData(): Promise<InitialData> {
  try {
    // Fetch holiday info
    const holidayPromise = fetch(`${process.env.NEXT_PUBLIC_API_URL}/holiday`, {
      next: { revalidate: 3600 }
    }).then(res => res.json());

    const today = getBuenosAiresDayOfWeek();

    const todayPromise = fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/channels/with-schedules?day=${today}&live_status=true`,
      {
        next: { revalidate: 60 }
      }
    ).then(res => res.json());

    const weekPromise = fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/channels/with-schedules?live_status=true`,
      {
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
  } catch {
    return {
      holiday: false,
      todaySchedules: [],
      weekSchedules: [],
    };
  }
}

export default async function HomePage() {
  const initialData = await getInitialData();

  return (
    <ClientWrapper>
      <HomeClient initialData={initialData} />
    </ClientWrapper>
  );
}