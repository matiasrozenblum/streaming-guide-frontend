'use client';
import { useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { jwtDecode } from 'jwt-decode';
import { useSessionContext } from '@/contexts/SessionContext';
import type { SessionWithToken } from '@/types/session';

export default function SessionPoller() {
  const { session } = useSessionContext();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeout when the session changes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const typedSession = session as SessionWithToken | null;
    if (!typedSession?.accessToken) {
      return;
    }

    // Decode JWT to check expiration
    const decoded = jwtDecode<{ exp: number }>(typedSession.accessToken);
    const expiresAt = decoded.exp * 1000;
    const now = Date.now();
    
    // Schedule the refresh to happen 1 minute before the token expires
    const refreshAt = expiresAt - (60 * 1000); 

    // If the token is already expired or needs immediate refresh, don't schedule a future refresh.
    // NextAuth's default behavior will handle this when an API call fails.
    if (refreshAt <= now) {
        return;
    }

    const timeoutDuration = refreshAt - now;

    timeoutRef.current = setTimeout(async () => {
      const res = await fetch('/api/auth/refresh', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        // signIn with the new token will trigger a session update,
        // which will re-run this useEffect and schedule the *next* refresh.
        await signIn('credentials', { redirect: false, accessToken: data.access_token });
      } else {
        console.warn('Token refresh failed with status:', res.status);
      }
    }, timeoutDuration);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [session]);

  return null;
} 