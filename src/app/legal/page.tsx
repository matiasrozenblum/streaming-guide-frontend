export const revalidate = 60;
export const dynamic = 'force-dynamic';

import { ChannelWithSchedules, Category } from '@/types/channel';
import HomeClient from '@/components/HomeClient';
import { ClientWrapper } from '@/components/ClientWrapper';
import { getBuenosAiresDayOfWeek } from '@/utils/date';

interface InitialData {
  holiday: boolean;
  todaySchedules: ChannelWithSchedules[];
  weekSchedules: ChannelWithSchedules[];
  categories: Category[];
}

export default async function Page() {
  // Get today's day of week using Buenos Aires time
  const today = getBuenosAiresDayOfWeek();

  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // Fetch today's schedules, week's schedules, and categories in parallel
  let todaySchedules: ChannelWithSchedules[] = [];
  let weekSchedules: ChannelWithSchedules[] = [];
  let categories: Category[] = [];

  try {
    const [todayRes, weekRes, categoriesRes] = await Promise.all([
      fetch(
        `${url}/channels/with-schedules?day=${today}`,
        { next: { revalidate: 60 } }
      ),
      fetch(
        `${url}/channels/with-schedules`,
        { next: { revalidate: 60 } }
      ),
      fetch(
        `${url}/categories`,
        { next: { revalidate: 3600 } }
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
  } catch (err) {
    console.warn('Fetch error during build/runtime:', err);
  }

  // Prepare the initial data with the correct structure
  const initialData: InitialData = {
    holiday: false, // Legal page doesn't need holiday info
    todaySchedules,
    weekSchedules,
    categories
  };

  // Renderiza componente cliente con datos pre-cargados
  return (
    <ClientWrapper>
      <HomeClient initialData={initialData} />
    </ClientWrapper>
  );
}