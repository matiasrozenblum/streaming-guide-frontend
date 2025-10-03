import HomeClient from '@/components/HomeClient';
import { ClientWrapper } from '@/components/ClientWrapper';
import type { ChannelWithSchedules, Category } from '@/types/channel';
import { getBuenosAiresDayOfWeek } from '@/utils/date';
import { Schedule } from '@/types/schedule';

interface InitialData {
  holiday: boolean;
  todaySchedules: ChannelWithSchedules[];
  weekSchedules: ChannelWithSchedules[];
  categories: Category[];
  categoriesEnabled: boolean;
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

    const categoriesPromise = fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/categories`,
      {
        next: { revalidate: 3600 } // Categories change less frequently
      }
    ).then(res => res.json());

    const categoriesEnabledPromise = fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/config/categories_enabled`,
      {
        next: { revalidate: 0 } // No caching for config - changes should be immediate
      }
    ).then(res => res.text()); // Config endpoint returns plain text

    const [holidayData, weekSchedules, categories, categoriesEnabledData] = await Promise.all([
      holidayPromise,
      weekPromise,
      categoriesPromise,
      categoriesEnabledPromise,
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
      categories: Array.isArray(categories) ? categories.sort((a: Category, b: Category) => (a.order || 0) - (b.order || 0)) : [],
      categoriesEnabled: categoriesEnabledData === 'true',
    };
  } catch {
    return {
      holiday: false,
      todaySchedules: [],
      weekSchedules: [],
      categories: [],
      categoriesEnabled: false, // Default to false on error
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