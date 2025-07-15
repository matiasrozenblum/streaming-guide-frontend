'use client';

import { useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

export default function FacebookAuthPopup() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const isPopup = searchParams.get('popup') === 'true';

  useEffect(() => {
    if (isPopup && status === 'unauthenticated') {
      // Start Facebook OAuth flow
      signIn('facebook', { callbackUrl: '/auth/facebook/callback?popup=true' });
    }
  }, [isPopup, status]);

  useEffect(() => {
    if (isPopup && session?.user) {
      // Send user data back to parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'SOCIAL_LOGIN_SUCCESS',
          user: {
            email: session.user.email,
            firstName: session.user.firstName,
            lastName: session.user.lastName,
            name: session.user.name,
            gender: session.user.gender,
            birthDate: session.user.birthDate,
          }
        }, window.location.origin);
        window.close();
      }
    }
  }, [isPopup, session]);

  if (!isPopup) {
    return <div>Invalid access</div>;
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2>Conectando con Meta...</h2>
        <p>Por favor, completa el proceso de autenticación.</p>
      </div>
    </div>
  );
} 