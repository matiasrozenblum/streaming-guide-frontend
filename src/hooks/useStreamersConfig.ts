import { useState, useEffect } from 'react';

export function useStreamersConfig() {
  const [streamersEnabled, setStreamersEnabled] = useState(false); // Default to false for safety
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config/streamers-enabled', {
          next: { revalidate: 60 }, // Cache for 1 minute
        });
        
        if (response.ok) {
          const data = await response.json();
          setStreamersEnabled(data.streamersEnabled || false);
        } else {
          setStreamersEnabled(false);
        }
      } catch (error) {
        console.warn('Error fetching streamers config:', error);
        setStreamersEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return { streamersEnabled, loading };
}

