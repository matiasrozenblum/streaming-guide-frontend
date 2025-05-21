export const revalidate = 60
export const dynamic = 'force-dynamic'

import HomeClient from '@/components/HomeClient'
import type { ChannelWithSchedules } from '@/types/channel'

export default async function Page() {
  // fetch SIN autenticación (para datos públicos)
  const url   = process.env.NEXT_PUBLIC_API_URL

  let initialData: ChannelWithSchedules[] = []
  try {
    const res = await fetch(`${url}/channels/with-schedules?live_status=true`, {
      next: { revalidate: 60 }
    })
    if (res.ok) initialData = await res.json()
  } catch {
    /* ignore */
  }

  return <HomeClient initialData={initialData} />
}