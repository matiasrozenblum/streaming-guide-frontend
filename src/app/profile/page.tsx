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
  
  // If no session at all, redirect to home
  if (!session?.user) {
    redirect('/');
  }

  // Check if profile is incomplete from session
  const extendedSession = session as ExtendedSession;
  const isProfileIncomplete = extendedSession.profileIncomplete === true;

  // If profile is incomplete, redirect to completion page
  if (isProfileIncomplete) {
    redirect('/profile-completion');
  }

  const initialUser = {
    firstName: session.user.firstName || session.user.name?.split(' ')[0] || '',
    lastName: session.user.lastName || session.user.name?.split(' ').slice(1).join(' ') || '',
    email: session.user.email || '',
    phone: '',
    gender: session.user.gender || '',
    birthDate: session.user.birthDate || '',
  };
  
  // Show the regular profile page for complete users
  return <ProfileClient initialUser={initialUser} />;
}