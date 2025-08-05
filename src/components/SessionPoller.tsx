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
        refreshToken: !!refreshToken,
        sessionKeys: session ? Object.keys(session as object) : []
      });
      return;
    }

    console.log('SessionPoller: Found tokens, checking expiration...');

    try {
      // Decode JWT to check expiration
      const decoded = jwtDecode<{ exp: number; iat: number }>(accessToken);
      const expiresAt = decoded.exp * 1000;
      const now = Date.now();
      
      // DEBUG MODE: Force token to appear expired for testing
      // Set this to true to test refresh mechanism
      const DEBUG_FORCE_EXPIRED = false;
      const testExpiresAt = DEBUG_FORCE_EXPIRED ? now - (5 * 60 * 1000) : expiresAt; // 5 minutes ago
      
      console.log('SessionPoller: Token analysis:', {
        expiresAt: new Date(expiresAt).toISOString(),
        currentTime: new Date(now).toISOString(),
        isExpired: now >= expiresAt,
        timeUntilExpiry: Math.round((expiresAt - now) / 1000 / 60), // minutes
        tokenAge: Math.round((now - (decoded.iat * 1000)) / 1000 / 60), // minutes since issued
        debugMode: DEBUG_FORCE_EXPIRED,
        testExpiresAt: DEBUG_FORCE_EXPIRED ? new Date(testExpiresAt).toISOString() : 'not used'
      });
      
      // Schedule the refresh to happen 10 minutes before the token expires (instead of 1 minute)
      const refreshAt = testExpiresAt - (10 * 60 * 1000); // 10 minutes before expiration
      const timeUntilRefresh = refreshAt - now;

      console.log('SessionPoller: Refresh scheduling:', {
        willRefreshAt: new Date(refreshAt).toISOString(),
        timeUntilRefresh: Math.round(timeUntilRefresh / 1000 / 60), // minutes
        shouldRefreshNow: refreshAt <= now
      });

      // If the token is already expired or needs immediate refresh, attempt refresh now
      if (refreshAt <= now) {
        console.log('SessionPoller: Token expired or needs immediate refresh, refreshing now');
        handleTokenRefresh(refreshToken);
        return;
      }

      const timeoutDuration = refreshAt - now;

      console.log('SessionPoller: Setting timeout for refresh in', Math.round(timeoutDuration / 1000 / 60), 'minutes');

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

  // DEBUG: Expose manual refresh function to window for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).testTokenRefresh = () => {
        console.log('SessionPoller: Manual refresh triggered from console');
        // Get refresh token from current session
        const currentSession = session as SessionWithTokens;
        if (currentSession?.refreshToken) {
          handleTokenRefresh(currentSession.refreshToken);
        } else {
          console.error('SessionPoller: No refresh token available for manual refresh');
        }
      };
      
      console.log('SessionPoller: Manual refresh available at window.testTokenRefresh()');
    }
  }, [session]);

  return null;
} 