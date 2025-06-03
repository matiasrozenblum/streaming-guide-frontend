'use client';
import { useEffect } from 'react';
import { getSession, signIn } from 'next-auth/react';
import { jwtDecode } from 'jwt-decode';

export default function SessionPoller() {
  useEffect(() => {
    const interval = setInterval(async () => {
      const session = await getSession();
      if (!session?.accessToken) {
        console.log('[SessionPoller] No access token in session');
        return;
      }

      // Decode JWT to check expiration
      const decoded = jwtDecode<{ exp: number }>(session.accessToken);
      const expiresIn = decoded.exp * 1000 - Date.now();
      console.log('[SessionPoller] Token expires in', Math.round(expiresIn / 1000), 'seconds');

      // If less than 5 minutes to expire, refresh
      if (expiresIn < 5 * 60 * 1000) {
        console.log('[SessionPoller] Attempting refresh...');
        const res = await fetch('/api/auth/refresh', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          console.log('[SessionPoller] Refresh successful, updating session');
          await signIn('credentials', { redirect: false, accessToken: data.access_token });
        } else {
          console.warn('[SessionPoller] Refresh failed', res.status);
        }
      }
    }, 2 * 60 * 1000); // every 2 minutes

    return () => clearInterval(interval);
  }, []);

  return null;
} 