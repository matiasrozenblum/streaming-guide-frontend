import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ProfileClient from '@/components/ProfileClient';
import ProfileCompletionForm from '@/components/ProfileCompletionForm';

interface ExtendedSession {
  profileIncomplete?: boolean;
  registrationToken?: string;
  accessToken?: string;
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  console.log('[ProfilePage] session:', session);
  console.log('[ProfilePage] session.user:', session?.user);
  console.log('[ProfilePage] session.user.id:', session?.user?.id);
  console.log('[ProfilePage] session.profileIncomplete:', (session as ExtendedSession)?.profileIncomplete);
  
  // If no session at all, redirect to home
  if (!session?.user) {
    console.log('[ProfilePage] No session, redirecting to /');
    redirect('/');
  }

  // Check if profile is incomplete from session
  const extendedSession = session as ExtendedSession;
  const isProfileIncomplete = extendedSession.profileIncomplete === true;
  console.log('[ProfilePage] Profile incomplete from session:', isProfileIncomplete);

  // If profile is incomplete, show the profile completion form
  if (isProfileIncomplete) {
    console.log('[ProfilePage] Showing profile completion form');
    
    if (!extendedSession.registrationToken) {
      console.log('[ProfilePage] No registration token available, redirecting to home');
      redirect('/');
    }
    
    return (
      <ProfileCompletionForm 
        registrationToken={extendedSession.registrationToken}
        initialUser={{
          firstName: session.user.firstName || session.user.name?.split(' ')[0] || '',
          lastName: session.user.lastName || session.user.name?.split(' ').slice(1).join(' ') || '',
          email: session.user.email || '',
          phone: '',
          gender: '',
          birthDate: '',
        }}
      />
    );
  }

  // User has complete profile, proceed with normal flow
  // Fetch user data from the backend API
  let initialUser = { firstName: '', lastName: '', email: '', phone: '', gender: '', birthDate: '' };
  
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/users/${session.user.id}`;
    console.log('[ProfilePage] Fetching user from:', apiUrl);
    
    if (!extendedSession.accessToken) {
      console.log('[ProfilePage] No access token available)');
      return <ProfileClient initialUser={initialUser} isProfileIncomplete={false} />;
    }
    
    const res = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${extendedSession.accessToken}` },
      cache: 'no-store',
    });
    console.log('[ProfilePage] Fetch response status:', res.status);
    
    if (res.ok) {
      const data = await res.json();
      console.log('[ProfilePage] User data received:', data);
      initialUser = {
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
        gender: data.gender ?? '',
        birthDate: data.birthDate ? data.birthDate.slice(0, 10) : '',
      };
    } else {
      console.log('[ProfilePage] Backend returned error, status:', res.status);
    }
  } catch (err) {
    console.log('[ProfilePage] Error fetching user:', err);
    // fallback to empty user
  }

  return <ProfileClient initialUser={initialUser} isProfileIncomplete={false} />;
}