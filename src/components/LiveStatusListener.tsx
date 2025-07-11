'use client';

import { useEffect, useRef } from 'react';

export default function LiveStatusListener() {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Only create SSE connection in browser
    if (typeof window === 'undefined') return;

    const connectSSE = () => {
      try {
        const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_API_URL}/youtube/live-events`);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            // On any event, trigger a refresh
            const refreshEvent = new CustomEvent('liveStatusRefresh', {
              detail: data
            });
            window.dispatchEvent(refreshEvent);
          } catch {
            // Silently handle JSON parse errors
          }
        };

        eventSource.onerror = () => {
          eventSource.close();
          // Reconnect after 5 seconds
          setTimeout(connectSSE, 5000);
        };

        return () => {
          eventSource.close();
        };
      } catch {
        // Silently handle connection errors
      }
    };

    connectSSE();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return null; // This component doesn't render anything
} 