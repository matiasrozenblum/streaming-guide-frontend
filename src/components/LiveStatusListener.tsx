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
          console.log('🔌 SSE connection opened successfully');
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('🔔 SSE Event received:', data);
            
            // Handle different types of events
            if (data.type === 'live_status_changed') {
              // Live status events - trigger live status refresh
              console.log('📡 Dispatching liveStatusRefresh event');
              const refreshEvent = new CustomEvent('liveStatusRefresh', {
                detail: data
              });
              window.dispatchEvent(refreshEvent);
            } else if (data.type === 'category_created' || 
                      data.type === 'category_updated' || 
                      data.type === 'category_deleted' ||
                      data.type === 'categories_reordered' ||
                      data.type === 'channel_created' || 
                      data.type === 'channel_updated' || 
                      data.type === 'channel_deleted' ||
                      data.type === 'channels_reordered') {
              // Category/Channel events - trigger page refresh
              console.log(`🔄 Received ${data.type} event, dispatching pageRefresh...`);
              const refreshEvent = new CustomEvent('pageRefresh', {
                detail: data
              });
              window.dispatchEvent(refreshEvent);
            } else {
              // Other events - trigger live status refresh as fallback
              console.log('📡 Dispatching liveStatusRefresh event (fallback)');
              const refreshEvent = new CustomEvent('liveStatusRefresh', {
                detail: data
              });
              window.dispatchEvent(refreshEvent);
            }
          } catch (error) {
            console.error('❌ Error parsing SSE event:', error);
          }
        };

        eventSource.onerror = (error) => {
          console.error('❌ SSE connection error:', error);
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