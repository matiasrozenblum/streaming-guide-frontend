import { useState, useEffect } from 'react';
import { ConfigService } from '@/services/config';

export function useSecondaryStreamsConfig() {
  const [showSecondaryStreams, setShowSecondaryStreams] = useState(true); // Default to true
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configs = await ConfigService.findAll();
        const config = configs.find(c => c.key === 'secondary_streams_button_visibility');
        
        if (config) {
          // Parse the string value to boolean
          setShowSecondaryStreams(config.value.toLowerCase() === 'true');
        }
        // If config not found, keep default value (true)
      } catch (error) {
        console.warn('Error fetching secondary streams config:', error);
        // Keep default value on error
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return { showSecondaryStreams, loading };
}
