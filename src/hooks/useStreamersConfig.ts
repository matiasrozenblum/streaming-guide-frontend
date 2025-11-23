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
          // Handle various response formats: "true", "null", empty string, etc.
          // Only set to true if the value is exactly the string "true"
          // If value is "null", empty string, or anything else, treat as false
          const trimmedValue = value?.trim();
          setStreamersEnabled(trimmedValue === 'true');
        } else {
          // If response is not ok (404, 500, etc.), config doesn't exist or error occurred
          // Explicitly set to false
          setStreamersEnabled(false);
        }
      } catch (error) {
        console.warn('Error fetching streamers config:', error);
        // Keep default value on error (false)
        setStreamersEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return { streamersEnabled, loading };
}

