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
          console.log('[SSE] Connected to live events stream');
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Define event categories for easier handling
            const pageRefreshEvents = [
              // Categories
              'category_created',
              'category_updated',
              'category_deleted',
              
              // Channels
              'channel_created',
              'channel_updated',
              'channel_deleted',
              'channels_reordered',
              
              // Programs
              'program_created',
              'program_updated',
              'program_deleted',
              'program_panelist_added',
              'program_panelist_removed',
              
              // Schedules
              'schedule_created',
              'schedule_updated',
              'schedule_deleted',
              'schedules_bulk_created',
              
              // Panelists
              'panelist_created',
              'panelist_updated',
              'panelist_deleted',
              'panelist_added_to_program',
              'panelist_removed_from_program',
              
              // Weekly Overrides
              'override_created',
              'override_updated',
              'override_deleted',
              'overrides_bulk_deleted',
            ];
            
            const liveStatusRefreshEvents = [
              'live_status_changed',
              'streamer_went_live',
              'streamer_went_offline',
            ];
            
            console.log('[SSE] Received event:', data.type);
            
            // Determine which type of refresh to trigger
            if (pageRefreshEvents.includes(data.type)) {
              // Events that require a full page refresh
              console.log('[SSE] Triggering page refresh for', data.type);
              const refreshEvent = new CustomEvent('pageRefresh', {
                detail: data
              });
              window.dispatchEvent(refreshEvent);
            } else if (liveStatusRefreshEvents.includes(data.type)) {
              // Live status events - trigger live status refresh only
              console.log('[SSE] Triggering live status refresh for', data.type);
              const refreshEvent = new CustomEvent('liveStatusRefresh', {
                detail: data
              });
              window.dispatchEvent(refreshEvent);
            } else {
              // Unknown event type - trigger live status refresh as fallback
              console.log('[SSE] Unknown event type, using live status refresh fallback:', data.type);
              const refreshEvent = new CustomEvent('liveStatusRefresh', {
                detail: data
              });
              window.dispatchEvent(refreshEvent);
            }
          } catch (error) {
            console.error('[SSE] Error parsing event data:', error);
          }
        };

        eventSource.onerror = (error) => {
          console.error('[SSE] Connection error, will reconnect in 5s:', error);
          eventSource.close();
          // Reconnect after 5 seconds
          setTimeout(connectSSE, 5000);
        };

        return () => {
          eventSource.close();
          console.log('[SSE] Connection closed');
        };
      } catch (error) {
        console.error('[SSE] Failed to create connection, will retry in 5s:', error);
        setTimeout(connectSSE, 5000);
      }
    };

    connectSSE();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        console.log('[SSE] Cleaned up on unmount');
      }
    };
  }, []);

  return null; // This component doesn't render anything
} 