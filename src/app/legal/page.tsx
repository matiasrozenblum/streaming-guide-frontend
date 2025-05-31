export const revalidate = 60;
export const dynamic = 'force-dynamic';

import { ChannelWithSchedules } from '@/types/channel';
import HomeClient from '@/components/HomeClient';
import { ClientWrapper } from '@/components/ClientWrapper';
import { getBuenosAiresDayOfWeek } from '@/utils/date';

interface InitialData {
  holiday: boolean;
  todaySchedules: ChannelWithSchedules[];
  weekSchedules: ChannelWithSchedules[];
}

export default async function Page() {
  // Get today's day of week using Buenos Aires time
  const today = getBuenosAiresDayOfWeek();

  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // Fetch both today's and week's schedules in parallel
  let todaySchedules: ChannelWithSchedules[] = [];
  let weekSchedules: ChannelWithSchedules[] = [];

  try {
    const [todayRes, weekRes] = await Promise.all([
      fetch(
        `${url}/channels/with-schedules?day=${today}`,
        { next: { revalidate: 60 } }
      ),
      fetch(
        `${url}/channels/with-schedules`,
        { next: { revalidate: 60 } }
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
  } catch (err) {
    console.warn('Fetch error during build/runtime:', err);
  }

  // Prepare the initial data with the correct structure
  const initialData: InitialData = {
    holiday: false, // Legal page doesn't need holiday info
    todaySchedules,
    weekSchedules
  };

  // Renderiza componente cliente con datos pre-cargados
  return (
    <ClientWrapper>
      <HomeClient initialData={initialData} />
    </ClientWrapper>
  );
}