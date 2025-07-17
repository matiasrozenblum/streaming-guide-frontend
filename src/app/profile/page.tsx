import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ProfileClient from '@/components/ProfileClient';

interface ExtendedSession {
  profileIncomplete?: boolean;
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

  // If user has no ID, this is likely a new social login user
  if (!session.user.id) {
    console.log('[ProfilePage] User has no ID, attempting to create user');
    
    // Try to create the user
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/social-login`, {
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
        console.log('[ProfilePage] User created successfully:', data);
        
        // Redirect to refresh the session with the new user ID
        redirect('/profile');
      } else {
        console.log('[ProfilePage] Failed to create user:', res.status);
      }
    } catch (error) {
      console.log('[ProfilePage] Error creating user:', error);
    }
    
    // Fallback to showing empty profile form
    const initialUser = {
      firstName: session.user.firstName || session.user.name?.split(' ')[0] || '',
      lastName: session.user.lastName || session.user.name?.split(' ').slice(1).join(' ') || '',
      email: session.user.email || '',
      phone: '',
      gender: '',
      birthDate: '',
    };
    return <ProfileClient initialUser={initialUser} isProfileIncomplete={true} />;
  }

  // User has ID, proceed with normal flow
  // Fetch user data from the backend API
  let initialUser = { firstName: '', lastName: '', email: '', phone: '', gender: '', birthDate: '' };
  
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/users/${session.user.id}`;
    console.log('[ProfilePage] Fetching user from:', apiUrl);
    const res = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
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

  return <ProfileClient initialUser={initialUser} isProfileIncomplete={isProfileIncomplete} />;
}