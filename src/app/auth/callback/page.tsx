'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function AuthCallback() {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  const createUserFromSession = async () => {
    if (!session?.user?.email) return;
    
    console.log('[Auth Callback] Creating user from session data');
    try {
      const res = await fetch('/api/auth/social-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: session.user.email,
          firstName: session.user.name?.split(' ')[0] || '',
          lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
          provider: 'google'
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('[Auth Callback] Auto-created user:', data);
        
        // Redirect to profile page instead of reloading
        console.log('[Auth Callback] Redirecting to profile page');
        window.location.href = '/profile';
      } else {
        console.error('[Auth Callback] Failed to create user:', res.status);
      }
    } catch (error) {
      console.error('[Auth Callback] Error creating user:', error);
    }
  };
  
  useEffect(() => {
    console.log('[Auth Callback] Page loaded');
    console.log('[Auth Callback] Search params:', Object.fromEntries(searchParams.entries()));
    console.log('[Auth Callback] Session status:', status);
    console.log('[Auth Callback] Session data:', session);
    
    // Check if we have a session with user data
    if (session?.user) {
      console.log('[Auth Callback] User in session:', {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image
      });
      
      // Check if this is a social login (no backend user ID yet)
      if (session.user.id && session.user.id.toString().length > 10) {
        console.log('[Auth Callback] This looks like a social provider ID, not backend user ID');
        console.log('[Auth Callback] User ID length:', session.user.id.toString().length);
        console.log('[Auth Callback] User ID:', session.user.id);
      } else {
        console.log('[Auth Callback] This looks like a backend user ID');
        console.log('[Auth Callback] User ID:', session.user.id);
      }
      
      // If no user ID, try to create user automatically
      if (!session.user.id && session.user.email) {
        console.log('[Auth Callback] No user ID found, attempting to create user automatically');
        createUserFromSession();
      }
    }
    
    // This page will be called after OAuth redirect
    // We can see what data NextAuth provides
  }, [searchParams, session, status, createUserFromSession]);
  
  const testSocialLogin = async () => {
    console.log('[Auth Callback] Testing social login manually');
    try {
      const res = await fetch('/api/auth/social-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          provider: 'google'
        }),
      });
      const data = await res.json();
      console.log('[Auth Callback] Social login response:', data);
    } catch (error) {
      console.error('[Auth Callback] Social login error:', error);
    }
  };
  
  const testSocialLoginWithSessionData = async () => {
    if (!session?.user) {
      console.log('[Auth Callback] No session user data available');
      return;
    }
    
    console.log('[Auth Callback] Testing social login with session data');
    try {
      const res = await fetch('/api/auth/social-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: session.user.email,
          firstName: session.user.name?.split(' ')[0] || '',
          lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
          provider: 'google'
        }),
      });
      const data = await res.json();
      console.log('[Auth Callback] Social login with session data response:', data);
    } catch (error) {
      console.error('[Auth Callback] Social login with session data error:', error);
    }
  };
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Auth Callback</h1>
      <p>Check console for details</p>
      <div style={{ marginBottom: '20px' }}>
        <h3>Session Status: {status}</h3>
        <h3>User ID: {session?.user?.id || 'None'}</h3>
        <h3>User Email: {session?.user?.email || 'None'}</h3>
        <h3>User Name: {session?.user?.name || 'None'}</h3>
      </div>
      <pre>{JSON.stringify(Object.fromEntries(searchParams.entries()), null, 2)}</pre>
      <div style={{ marginTop: '20px' }}>
        <button onClick={testSocialLogin} style={{ marginRight: '10px', padding: '10px' }}>
          Test Social Login (Test Data)
        </button>
        <button onClick={testSocialLoginWithSessionData} style={{ padding: '10px' }}>
          Test Social Login (Session Data)
        </button>
      </div>
    </div>
  );
} 