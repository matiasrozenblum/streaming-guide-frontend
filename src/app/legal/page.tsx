export const revalidate = 60;
export const dynamic = 'force-dynamic';

import { ChannelWithSchedules, Category } from '@/types/channel';
import HomeClient from '@/components/HomeClient';
import { ClientWrapper } from '@/components/ClientWrapper';

interface InitialData {
  holiday: boolean;
  todaySchedules: ChannelWithSchedules[];
  weekSchedules: ChannelWithSchedules[];
  categories: Category[];
  categoriesEnabled: boolean;
  streamersEnabled: boolean;
}

export default async function Page() {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // Fetch today's schedules, week's schedules, categories, and categories enabled status in parallel
  let todaySchedules: ChannelWithSchedules[] = [];
  let weekSchedules: ChannelWithSchedules[] = [];
  let categories: Category[] = [];
  let categoriesEnabled = false;
  let streamersEnabled = false;

  try {
    const [todayRes, weekRes, categoriesRes, categoriesEnabledRes, streamersEnabledRes] = await Promise.all([
      fetch(
        `${url}/channels/with-schedules/today`,
        { next: { revalidate: 60 } }
      ),
      fetch(
        `${url}/channels/with-schedules/week`,
        { next: { revalidate: 60 } }
      ),
      fetch(
        `${url}/categories`,
        { next: { revalidate: 3600 } }
      ),
      fetch(
        `${url}/config/categories_enabled`,
        { next: { revalidate: 0 } } // No caching for config - changes should be immediate
      ),
      fetch(
        `${url}/config/streamers_enabled`,
        { next: { revalidate: 0 } } // No caching for config - changes should be immediate
      )
    ]);

    if (todayRes.ok) {
      todaySchedules = await todayRes.json();
    } else {
      console.warn('Today schedules fetch failed with status', todayRes.status);
    }

    if (weekRes.ok) {
      weekSchedules = await weekRes.json();
    } else {
      console.warn('Week schedules fetch failed with status', weekRes.status);
    }

    if (categoriesRes.ok) {
      categories = await categoriesRes.json();
      categories = categories.sort((a: Category, b: Category) => (a.order || 0) - (b.order || 0));
    } else {
      console.warn('Categories fetch failed with status', categoriesRes.status);
    }

    if (categoriesEnabledRes.ok) {
      const categoriesEnabledData = await categoriesEnabledRes.text();
      categoriesEnabled = categoriesEnabledData === 'true';
    } else {
      console.warn('Categories enabled fetch failed with status', categoriesEnabledRes.status);
    }
 
    if (streamersEnabledRes.ok) {
      const streamersEnabledData = await streamersEnabledRes.text();
      streamersEnabled = streamersEnabledData === 'true';
    } else {
      console.warn('Streamers enabled fetch failed with status', streamersEnabledRes.status);
    }
  } catch (err) {
    console.warn('Fetch error during build/runtime:', err);
  }

  // Prepare the initial data with the correct structure
  const initialData: InitialData = {
    holiday: false, // Legal page doesn't need holiday info
    todaySchedules,
    weekSchedules,
    categories,
    categoriesEnabled,
    streamersEnabled
  };

  // Renderiza componente cliente con datos pre-cargados
  return (
    <ClientWrapper>
      <HomeClient initialData={initialData} />
    </ClientWrapper>
  );
}