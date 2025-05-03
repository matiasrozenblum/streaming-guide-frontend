export const revalidate = 60;

import { ChannelWithSchedules } from '@/types/channel';
import HomeClient from '@/components/HomeClient';


export default async function Page() {
  // Calcula el día de la semana en inglés en minúsculas
  const today = new Date()
    .toLocaleString('en-US', { weekday: 'long' })
    .toLowerCase();

  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // Fetch inicial en el servidor, con revalidación ISR cada 60s
  const res = await fetch(
    `${url}/channels/with-schedules?day=${today}`,
    { next: { revalidate: 60 } }
  );
  const initialData: ChannelWithSchedules[] = await res.json();

  // Renderiza componente cliente con datos pre-cargados
  return <HomeClient initialData={initialData} />;
}