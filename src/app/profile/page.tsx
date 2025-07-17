import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ProfileClient from '@/components/ProfileClient';

interface ExtendedSession {
  profileIncomplete?: boolean;
  registrationToken?: string;
  accessToken?: string;
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  console.log('[ProfilePage] session:', session);
  
  // If no session at all, redirect to home
  if (!session?.user) {
    console.log('[ProfilePage] No session, redirecting to /');
    redirect('/');
  }

  // Check if profile is incomplete from session
  const extendedSession = session as ExtendedSession;
  const isProfileIncomplete = extendedSession.profileIncomplete === true;
  console.log('[ProfilePage] Profile incomplete from session:', isProfileIncomplete);

  // Always show ProfileClient - it will handle incomplete users
  const initialUser = {
    firstName: session.user.firstName || session.user.name?.split(' ')[0] || '',
    lastName: session.user.lastName || session.user.name?.split(' ').slice(1).join(' ') || '',
    email: session.user.email || '',
    phone: '',
    gender: '',
    birthDate: '',
  };
  
  return <ProfileClient initialUser={initialUser} isProfileIncomplete={isProfileIncomplete} />;
}