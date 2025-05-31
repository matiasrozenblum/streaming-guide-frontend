import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ProfileClient from '@/components/ProfileClient';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !session.user.id) {
    redirect('/');
  }

  // Fetch user data from the backend API
  let initialUser = { firstName: '', lastName: '', email: '', phone: '', gender: '', birthDate: '' };
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/${session.user.id}`,
      {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: 'no-store',
      }
    );
    if (res.ok) {
      const data = await res.json();
      initialUser = {
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
        gender: data.gender ?? '',
        birthDate: data.birthDate ? data.birthDate.slice(0, 10) : '',
      };
    }
  } catch {
    // fallback to empty user
  }

  return <ProfileClient initialUser={initialUser} />;
}