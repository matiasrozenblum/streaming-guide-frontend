import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import HomeClient from '@/components/HomeClient';
import { ClientWrapper } from '@/components/ClientWrapper';
import type { ChannelWithSchedules } from '@/types/channel';

interface InitialData {
  holiday: boolean;
  schedules: ChannelWithSchedules[];
}

async function getInitialData(token: string): Promise<InitialData> {
  try {
    // Fetch holiday info
    const holidayResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/holiday`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    const holidayData = await holidayResponse.json();

    // Get today's day of week in lowercase
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    // Fetch only today's schedules
    const schedulesResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/channels/with-schedules?day=${today}&live_status=true`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 60 } // Cache for 1 minute
      }
    );
    const schedulesData = await schedulesResponse.json();

    return {
      holiday: holidayData.holiday,
      schedules: schedulesData
    };
  } catch (error) {
    console.error('Error fetching initial data:', error);
    return {
      holiday: false,
      schedules: []
    };
  }
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.accessToken) {
    return null; // This will trigger the client-side redirect in HomeClient
  }

  const initialData = await getInitialData(session.accessToken);

  return (
    <ClientWrapper>
      <HomeClient initialData={initialData} />
    </ClientWrapper>
  );
}