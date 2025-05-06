export const revalidate = 60;
export const dynamic = 'force-dynamic';

import { ChannelWithSchedules } from '@/types/channel';
import HomeClient from '@/components/HomeClient';
import { useDeviceId } from '@/hooks/useDeviceId';

export default async function Page() {
  // Calcula el día de la semana en inglés en minúsculas
  const today = new Date()
    .toLocaleString('en-US', { weekday: 'long' })
    .toLowerCase();

  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const deviceId = useDeviceId();

  // Fetch inicial (ISR cada 60s), con fallback seguro en caso de fallo
  let initialData: ChannelWithSchedules[] = [];
  try {
    const res = await fetch(
      `${url}/channels/with-schedules?day=${today}`,
      { next: { revalidate: 60 } }
    );
    if (res.ok) {
      initialData = await res.json();
    } else {
      console.warn('Fetch failed with status', res.status);
    }
  } catch (err) {
    console.warn('Fetch error during build/runtime:', err);
  }

  // Renderiza componente cliente con datos pre-cargados
  return <HomeClient initialData={initialData} />;
}