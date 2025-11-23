import { useState, useEffect } from 'react';

export function useStreamersConfig() {
  const [streamersEnabled, setStreamersEnabled] = useState(false); // Default to false for safety
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const response = await fetch(`${url}/config/streamers_enabled`, {
          cache: 'no-store',
        });
        
        if (response.ok) {
          const value = await response.text();
          setStreamersEnabled(value === 'true');
        }
        // If config not found or error, keep default value (false) - safer for production
      } catch (error) {
        console.warn('Error fetching streamers config:', error);
        // Keep default value on error (false)
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return { streamersEnabled, loading };
}

