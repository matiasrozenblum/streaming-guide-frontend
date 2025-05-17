export const revalidate = 60
export const dynamic = 'force-dynamic'

import HomeClient from '@/components/HomeClient'
import type { ChannelWithSchedules } from '@/types/channel'

export default async function Page() {
  // fetch SIN autenticación (para datos públicos)
  const today = new Date().toLocaleString('en-US', { weekday: 'long' }).toLowerCase()
  const url   = process.env.NEXT_PUBLIC_API_URL

  let initialData: ChannelWithSchedules[] = []
  try {
    const res = await fetch(`${url}/channels/with-schedules?day=${today}`, {
      next: { revalidate: 60 }
    })
    if (res.ok) initialData = await res.json()
  } catch {
    /* ignore */
  }

  return <HomeClient initialData={initialData} />
}