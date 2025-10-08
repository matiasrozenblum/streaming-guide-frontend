'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PageRefreshListener() {
  const router = useRouter();

  useEffect(() => {
    // Only create event listener in browser
    if (typeof window === 'undefined') return;

    const handlePageRefresh = (event: CustomEvent) => {
      console.log('🔄 PageRefreshListener: Page refresh triggered by SSE event:', event.detail);
      console.log('🔄 PageRefreshListener: Calling router.refresh()...');
      
      // Use Next.js router to refresh the current page
      // This will trigger a re-fetch of server components and update the UI
      router.refresh();
      
      console.log('🔄 PageRefreshListener: router.refresh() called');
    };

    window.addEventListener('pageRefresh', handlePageRefresh as EventListener);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('pageRefresh', handlePageRefresh as EventListener);
    };
  }, [router]);

  return null; // This component doesn't render anything
}
