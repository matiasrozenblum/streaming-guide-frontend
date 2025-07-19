'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ProfileCompletionForm from './ProfileCompletionForm';

interface ExtendedSession {
  profileIncomplete?: boolean;
  registrationToken?: string;
  accessToken?: string;
}

interface InitialUser {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  birthDate: string;
}

export default function ProfileCompletionWrapper() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') {
      return; // Still loading session
    }

    if (status === 'unauthenticated' || !session?.user) {
      console.log('[ProfileCompletionWrapper] No session, redirecting to /');
      router.replace('/');
      return;
    }

    const extendedSession = session as ExtendedSession;
    const isProfileIncomplete = extendedSession.profileIncomplete === true;
    const registrationToken = extendedSession.registrationToken;

    console.log('[ProfileCompletionWrapper] Session status:', {
      status,
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      profileIncomplete: isProfileIncomplete,
      hasRegistrationToken: !!registrationToken,
      shouldRedirect: !isProfileIncomplete || !registrationToken
    });

    if (!isProfileIncomplete || !registrationToken) {
      console.log('[ProfileCompletionWrapper] Profile complete or no token, redirecting to /');
      router.replace('/');
      return;
    }

    // If we reach here, we should show the profile completion form
    setIsLoading(false);
  }, [session, status, router]);

  // Show loading spinner while checking session
  if (status === 'loading' || isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#0F172A'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If we have the required data, render the form
  if (session?.user) {
    const extendedSession = session as ExtendedSession;
    const registrationToken = extendedSession.registrationToken;

    const initialUser: InitialUser = {
      firstName: session.user.firstName || session.user.name?.split(' ')[0] || '',
      lastName: session.user.lastName || session.user.name?.split(' ').slice(1).join(' ') || '',
      email: session.user.email || '',
      phone: '',
      gender: session.user.gender || '',
      birthDate: session.user.birthDate || '',
    };

    return (
      <ProfileCompletionForm 
        initialUser={initialUser} 
        registrationToken={registrationToken!}
      />
    );
  }

  // Fallback (shouldn't reach here due to redirects above)
  return null;
} 