'use client';

import { useEffect, useState } from 'react';
import { fetchConfig } from '@/services/config';

export const useHotjar = () => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      const val = await fetchConfig('HOTJAR_ENABLED');
      setEnabled(val === 'true');
    };

    loadConfig();
  }, []);

  return enabled;
};