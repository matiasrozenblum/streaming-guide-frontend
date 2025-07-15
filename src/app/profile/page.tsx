import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ProfileClient from '@/components/ProfileClient';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  console.log('[ProfilePage] session:', session);
  if (!session?.user || !session.user.id) {
    console.log('[ProfilePage] No session or user.id, redirecting to /');
    redirect('/');
  }

  // Fetch user data from the backend API
  let initialUser = { firstName: '', lastName: '', email: '', phone: '', gender: '', birthDate: '' };
  let isProfileIncomplete = false;
  
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
      
      // Check if profile is incomplete (missing required fields)
      isProfileIncomplete = !data.firstName || !data.lastName || !data.gender || !data.birthDate;
    } else {
      console.log('[ProfilePage] Backend returned error, status:', res.status);
    }
  } catch (err) {
    console.log('[ProfilePage] Error fetching user:', err);
    // fallback to empty user
  }

  return <ProfileClient initialUser={initialUser} isProfileIncomplete={isProfileIncomplete} />;
}