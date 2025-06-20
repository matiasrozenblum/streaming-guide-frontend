import HomeClient from '@/components/HomeClient';
import { ClientWrapper } from '@/components/ClientWrapper';
import type { ChannelWithSchedules } from '@/types/channel';
import { getBuenosAiresDayOfWeek } from '@/utils/date';
import { Schedule } from '@/types/schedule';

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

    const weekPromise = fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/channels/with-schedules?live_status=true`,
      {
        next: { revalidate: 300 }
      }
    ).then(res => res.json());

    const [holidayData, weekSchedules] = await Promise.all([
      holidayPromise,
      weekPromise,
    ]);

    const today = getBuenosAiresDayOfWeek();
    const todaySchedules = Array.isArray(weekSchedules)
      ? weekSchedules.map((channel: ChannelWithSchedules) => ({
          ...channel,
          schedules: channel.schedules.filter((schedule: Schedule) => schedule.day_of_week.toLowerCase() === today.toLowerCase()),
        })).filter((channel: ChannelWithSchedules) => channel.schedules.length > 0)
      : [];

    return {
      holiday: !!holidayData.holiday,
      todaySchedules,
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