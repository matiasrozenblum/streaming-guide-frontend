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
    } else if (res.status === 404) {
      // User doesn't exist in backend, this is likely a social login
      console.log('[ProfilePage] User not found in backend, handling social login');
      
      // Call social login endpoint to create/update user
      const socialLoginRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/social-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'google', // We'll need to determine this from the session
          accessToken: session.accessToken,
          user: {
            email: session.user.email,
            firstName: session.user.firstName || session.user.name?.split(' ')[0] || '',
            lastName: session.user.lastName || session.user.name?.split(' ').slice(1).join(' ') || '',
          },
        }),
      });
      
      if (socialLoginRes.ok) {
        const socialData = await socialLoginRes.json();
        console.log('[ProfilePage] Social login response:', socialData);
        
        if (socialData.profileIncomplete) {
          // Profile is incomplete, show completion form
          isProfileIncomplete = true;
          initialUser = {
            firstName: socialData.user?.firstName || session.user.firstName || '',
            lastName: socialData.user?.lastName || session.user.lastName || '',
            email: session.user.email || '',
            phone: '',
            gender: '',
            birthDate: '',
          };
        } else {
          // Profile is complete, redirect to home
          redirect('/');
        }
      } else {
        console.log('[ProfilePage] Social login failed, status:', socialLoginRes.status);
        // Fallback to empty user
      }
    } else {
      console.log('[ProfilePage] Backend returned error, status:', res.status);
    }
  } catch (err) {
    console.log('[ProfilePage] Error fetching user:', err);
    // fallback to empty user
  }

  return <ProfileClient initialUser={initialUser} isProfileIncomplete={isProfileIncomplete} />;
}