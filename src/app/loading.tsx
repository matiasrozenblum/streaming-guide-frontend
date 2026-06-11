'use client';

// Next.js streams this as the Suspense fallback while page.tsx is fetching data.
// On cold starts (slow backend), the browser shows this skeleton immediately
// instead of a blank tab, then transitions to the real content when SSR completes.
import { HomePageSkeleton } from '@/components/HomePageSkeleton';

export default function Loading() {
  return <HomePageSkeleton />;
}
