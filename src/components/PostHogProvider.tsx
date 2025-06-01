'use client';
import { useEffect } from 'react';
import posthog from 'posthog-js';

export function PostHogProvider() {
  useEffect(() => {
    posthog.init('phc_ioX3gwDuENT8MoUWSacARsCFVE6bSbKaEh5u7Mie5oK', {
      api_host: 'https://app.posthog.com',
      loaded: (ph) => {
        if (process.env.NODE_ENV === 'development') ph.opt_out_capturing();
      }
    });
  }, []);
  return null;
} 