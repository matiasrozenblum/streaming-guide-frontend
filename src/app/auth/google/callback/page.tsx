'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

export default function GoogleAuthCallback() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const isPopup = searchParams.get('popup') === 'true';

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
    } else if (isPopup && status === 'unauthenticated') {
      // Handle error
      if (window.opener) {
        window.opener.postMessage({
          type: 'SOCIAL_LOGIN_ERROR',
          error: 'Error en la autenticación con Google'
        }, window.location.origin);
        window.close();
      }
    }
  }, [isPopup, session, status]);

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
        <h2>Procesando...</h2>
        <p>Completando la autenticación con Google.</p>
      </div>
    </div>
  );
} 