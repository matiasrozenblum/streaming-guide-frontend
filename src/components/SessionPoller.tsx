'use client';
import { useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { jwtDecode } from 'jwt-decode';
import { useSessionContext } from '@/contexts/SessionContext';

interface SessionWithTokens {
  user?: {
    id: string;
    role: string;
    name?: string;
    email?: string;
  };
  accessToken?: string;
  refreshToken?: string;
  access_token?: string;
  refresh_token?: string;
}

export default function SessionPoller() {
  const { session } = useSessionContext();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add a simple test to verify the component is running
  useEffect(() => {
    console.log('SessionPoller: Component mounted');
    return () => {
      console.log('SessionPoller: Component unmounted');
    };
  }, []);

  useEffect(() => {
    // Clear any existing timeout when the session changes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    console.log('SessionPoller: Session changed:', {
      hasSession: !!session,
      sessionKeys: session ? Object.keys(session as object) : [],
      user: (session as SessionWithTokens)?.user,
      accessToken: (session as SessionWithTokens)?.accessToken ? 'present' : 'missing',
      refreshToken: (session as SessionWithTokens)?.refreshToken ? 'present' : 'missing'
    });

    // Check if session has the required structure
    if (!session || !(session as SessionWithTokens)?.user) {
      console.log('SessionPoller: No session or user data available');
      return;
    }

    // Try to get tokens from different possible locations
    const accessToken = (session as SessionWithTokens)?.accessToken || (session as SessionWithTokens)?.access_token;
    const refreshToken = (session as SessionWithTokens)?.refreshToken || (session as SessionWithTokens)?.refresh_token;

    if (!accessToken || !refreshToken) {
      console.log('SessionPoller: No access token or refresh token available', {
        accessToken: !!accessToken,
        refreshToken: !!refreshToken
      });
      return;
    }

    try {
      // Decode JWT to check expiration
      const decoded = jwtDecode<{ exp: number }>(accessToken);
      const expiresAt = decoded.exp * 1000;
      const now = Date.now();
      
      console.log('SessionPoller: Token expires at:', new Date(expiresAt).toISOString());
      console.log('SessionPoller: Current time:', new Date(now).toISOString());
      
      // Schedule the refresh to happen 10 minutes before the token expires (instead of 1 minute)
      const refreshAt = expiresAt - (10 * 60 * 1000); // 10 minutes before expiration
      const timeUntilRefresh = refreshAt - now;

      console.log('SessionPoller: Will refresh at:', new Date(refreshAt).toISOString());
      console.log('SessionPoller: Time until refresh:', Math.round(timeUntilRefresh / 1000), 'seconds');

      // If the token is already expired or needs immediate refresh, attempt refresh now
      if (refreshAt <= now) {
        console.log('SessionPoller: Token expired or needs immediate refresh, refreshing now');
        handleTokenRefresh(refreshToken);
        return;
      }

      const timeoutDuration = refreshAt - now;

      timeoutRef.current = setTimeout(async () => {
        console.log('SessionPoller: Scheduled refresh triggered');
        await handleTokenRefresh(refreshToken);
      }, timeoutDuration);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    } catch (error) {
      console.error('SessionPoller: Error decoding token:', error);
    }
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
        const errorText = await res.text();
        console.error('SessionPoller: Token refresh error response:', errorText);
        // If refresh fails, we might need to redirect to login
        // This will be handled by NextAuth when API calls fail
      }
    } catch (error) {
      console.error('SessionPoller: Token refresh error:', error);
    }
  };

  return null;
} 