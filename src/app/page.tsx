export const revalidate = 60;
export const dynamic = 'force-dynamic';

import { ChannelWithSchedules } from '@/types/channel';
import HomeClient from '@/components/HomeClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function Page() {
  // Calcula el día de la semana en inglés en minúsculas
  const today = new Date()
    .toLocaleString('en-US', { weekday: 'long' })
    .toLowerCase();

  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  //const token = cookieStore.get('public_token')?.value;
  const session = await getServerSession(authOptions);
  const token = session?.accessToken;
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