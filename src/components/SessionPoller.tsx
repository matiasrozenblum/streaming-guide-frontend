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
    if (!typedSession?.accessToken || !typedSession?.refreshToken) {
      console.log('SessionPoller: No access token or refresh token available');
      return;
    }

    // Decode JWT to check expiration
    const decoded = jwtDecode<{ exp: number }>(typedSession.accessToken);
    const expiresAt = decoded.exp * 1000;
    const now = Date.now();
    
    console.log('SessionPoller: Token expires at:', new Date(expiresAt).toISOString());
    console.log('SessionPoller: Current time:', new Date(now).toISOString());
    
    // Schedule the refresh to happen 1 minute before the token expires
    const refreshAt = expiresAt - (60 * 1000); 
    const timeUntilRefresh = refreshAt - now;

    console.log('SessionPoller: Will refresh at:', new Date(refreshAt).toISOString());
    console.log('SessionPoller: Time until refresh:', Math.round(timeUntilRefresh / 1000), 'seconds');

    // If the token is already expired or needs immediate refresh, attempt refresh now
    if (refreshAt <= now) {
      console.log('SessionPoller: Token expired or needs immediate refresh, refreshing now');
      handleTokenRefresh(typedSession.refreshToken);
      return;
    }

    const timeoutDuration = refreshAt - now;

    timeoutRef.current = setTimeout(async () => {
      console.log('SessionPoller: Scheduled refresh triggered');
      if (typedSession.refreshToken) {
        await handleTokenRefresh(typedSession.refreshToken);
      } else {
        console.error('SessionPoller: No refresh token available for scheduled refresh');
      }
    }, timeoutDuration);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [session]);

  const handleTokenRefresh = async (refreshToken: string) => {
    try {
      console.log('SessionPoller: Starting token refresh...');
      const res = await fetch('/api/auth/refresh', { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('SessionPoller: Token refresh successful, updating session');
        // signIn with the new tokens will trigger a session update,
        // which will re-run this useEffect and schedule the *next* refresh.
        await signIn('credentials', { 
          redirect: false, 
          accessToken: data.access_token,
          refreshToken: data.refresh_token 
        });
      } else {
        console.warn('SessionPoller: Token refresh failed with status:', res.status);
        // If refresh fails, we might need to redirect to login
        // This will be handled by NextAuth when API calls fail
      }
    } catch (error) {
      console.error('SessionPoller: Token refresh error:', error);
    }
  };

  return null;
} 