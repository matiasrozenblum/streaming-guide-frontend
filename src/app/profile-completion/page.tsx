import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ProfileCompletionForm from '@/components/ProfileCompletionForm';

interface ExtendedSession {
  profileIncomplete?: boolean;
  registrationToken?: string;
  accessToken?: string;
}

export default async function ProfileCompletionPage() {
  const session = await getServerSession(authOptions);
  console.log('[ProfileCompletionPage] session:', session);
  
  // If no session at all, redirect to home
  if (!session?.user) {
    console.log('[ProfileCompletionPage] No session, redirecting to /');
    redirect('/');
  }

  // Check if profile is incomplete from session
  const extendedSession = session as ExtendedSession;
  const isProfileIncomplete = extendedSession.profileIncomplete === true;
  const registrationToken = extendedSession.registrationToken;
  
  console.log('[ProfileCompletionPage] Profile incomplete from session:', isProfileIncomplete);
  console.log('[ProfileCompletionPage] Registration token:', !!registrationToken);

  // If profile is complete, redirect to regular profile page
  if (!isProfileIncomplete || !registrationToken) {
    console.log('[ProfileCompletionPage] Profile complete or no token, redirecting to /profile');
    redirect('/profile');
  }

  const initialUser = {
    firstName: session.user.firstName || session.user.name?.split(' ')[0] || '',
    lastName: session.user.lastName || session.user.name?.split(' ').slice(1).join(' ') || '',
    email: session.user.email || '',
    phone: '',
    gender: session.user.gender || '',
    birthDate: session.user.birthDate || '',
  };
  
  return <ProfileCompletionForm 
    initialUser={initialUser} 
    registrationToken={registrationToken}
  />;
} 