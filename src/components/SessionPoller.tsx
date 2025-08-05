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

  useEffect(() => {
    // Clear any existing timeout when the session changes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Check if session has the required structure
    if (!session || !(session as SessionWithTokens)?.user) {
      return;
    }

    // Try to get tokens from different possible locations
    const accessToken = (session as SessionWithTokens)?.accessToken || (session as SessionWithTokens)?.access_token;
    const refreshToken = (session as SessionWithTokens)?.refreshToken || (session as SessionWithTokens)?.refresh_token;

    if (!accessToken || !refreshToken) {
      return;
    }

    try {
      // Decode JWT to check expiration
      const decoded = jwtDecode<{ exp: number; iat: number }>(accessToken);
      const expiresAt = decoded.exp * 1000;
      const now = Date.now();
      
      // Schedule the refresh to happen 10 minutes before the token expires
      const refreshAt = expiresAt - (10 * 60 * 1000); // 10 minutes before expiration

      // If the token is already expired or needs immediate refresh, attempt refresh now
      if (refreshAt <= now) {
        handleTokenRefresh(refreshToken);
        return;
      }

      const timeoutDuration = refreshAt - now;

      // Set up multiple refresh strategies for better reliability
      timeoutRef.current = setTimeout(async () => {
        await handleTokenRefresh(refreshToken);
      }, timeoutDuration);

      // Also set up a more frequent check for background scenarios
      const backgroundCheckInterval = Math.min(timeoutDuration, 5 * 60 * 1000); // Check every 5 minutes max
      const backgroundTimeout = setTimeout(async () => {
        // Re-check if refresh is needed
        try {
          const currentDecoded = jwtDecode<{ exp: number; iat: number }>(accessToken);
          const currentExpiresAt = currentDecoded.exp * 1000;
          const currentNow = Date.now();
          const currentRefreshAt = currentExpiresAt - (10 * 60 * 1000);
          
          if (currentRefreshAt <= currentNow) {
            await handleTokenRefresh(refreshToken);
          }
        } catch {
          // Silent error handling for background checks
        }
      }, backgroundCheckInterval);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        clearTimeout(backgroundTimeout);
      };
    } catch {
      // Silent error handling for token decoding
    }
  }, [session]);

  const handleTokenRefresh = async (refreshToken: string) => {
    try {
      const res = await fetch('/api/auth/refresh', { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        // signIn with the new tokens will trigger a session update,
        // which will re-run this useEffect and schedule the *next* refresh.
        await signIn('credentials', { 
          redirect: false, 
          accessToken: data.access_token,
          refreshToken: data.refresh_token 
        });
      }
    } catch {
      // Silent error handling for token refresh
    }
  };

  // Handle visibility change (when user returns to tab after device sleep)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const currentSession = session as SessionWithTokens;
        const accessToken = currentSession?.accessToken || currentSession?.access_token;
        const refreshToken = currentSession?.refreshToken || currentSession?.refresh_token;
        
        if (accessToken && refreshToken) {
          try {
            const decoded = jwtDecode<{ exp: number; iat: number }>(accessToken);
            const expiresAt = decoded.exp * 1000;
            const now = Date.now();
            const refreshAt = expiresAt - (10 * 60 * 1000);
            
            if (refreshAt <= now) {
              await handleTokenRefresh(refreshToken);
            }
          } catch {
            // Silent error handling for visibility change checks
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session]);

  return null;
} 