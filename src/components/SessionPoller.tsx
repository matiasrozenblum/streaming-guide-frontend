'use client';
import { useEffect } from 'react';
import { getSession } from 'next-auth/react';

export default function SessionPoller() {
  useEffect(() => {
    const interval = setInterval(() => {
      getSession(); // Triggers NextAuth refresh logic
    }, 2 * 60 * 1000); // every 2 minutes

    return () => clearInterval(interval);
  }, []);

  return null;
} 