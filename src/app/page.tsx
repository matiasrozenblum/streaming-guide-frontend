import HomeClient from '@/components/HomeClient';
import { ClientWrapper } from '@/components/ClientWrapper';
import type { ChannelWithSchedules, Category } from '@/types/channel';

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

    // Use new optimized endpoints
    const todayPromise = fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/channels/with-schedules/today?live_status=true`,
      {
        next: { revalidate: 300 }
      }
    ).then(res => res.json());

    const weekPromise = fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/channels/with-schedules/week?live_status=true`,
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

    const [holidayData, todaySchedules, weekSchedules, categories, categoriesEnabledData] = await Promise.all([
      holidayPromise,
      todayPromise,
      weekPromise,
      categoriesPromise,
      categoriesEnabledPromise,
    ]);

    return {
      holiday: !!holidayData.holiday,
      todaySchedules: Array.isArray(todaySchedules) ? todaySchedules : [],
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