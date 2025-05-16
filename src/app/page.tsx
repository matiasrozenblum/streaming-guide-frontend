export const revalidate = 60;
export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { ChannelWithSchedules } from '@/types/channel';
import HomeClient from '@/components/HomeClient';


export default async function Page() {
  // Calcula el día de la semana en inglés en minúsculas
  const today = new Date()
    .toLocaleString('en-US', { weekday: 'long' })
    .toLowerCase();

  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // 1) Leemos la cookie public_token
  const cookieStore = await cookies();
  const token = cookieStore.get('public_token')?.value;
  console.log('page.tsx token', token);

  // 2) Preparamos headers, sólo si hay token
  const headers: Record<string,string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  // 3) Fetch inicial (ISR cada 60s), ahora con auth
  let initialData: ChannelWithSchedules[] = [];
  try {
    const res = await fetch(
      `${url}/channels/with-schedules?day=${today}`,
      {
        next: { revalidate: 60 },
        headers
      }
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