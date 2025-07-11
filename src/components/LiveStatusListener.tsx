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
          console.log('🔗 SSE connection established for live status updates');
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📡 SSE event received:', data.type, data);
            // On any event, trigger a refresh
            const refreshEvent = new CustomEvent('liveStatusRefresh', {
              detail: data
            });
            window.dispatchEvent(refreshEvent);
          } catch (error) {
            console.error('Error parsing SSE message:', error);
          }
        };

        eventSource.onerror = (error) => {
          console.error('SSE connection error:', error);
          eventSource.close();
          // Reconnect after 5 seconds
          setTimeout(connectSSE, 5000);
        };

        return () => {
          eventSource.close();
        };
      } catch (error) {
        console.error('Failed to establish SSE connection:', error);
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