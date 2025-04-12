import { cookies } from 'next/headers';

export const BACKOFFICE_TOKEN_KEY = 'backoffice_token';
export const PUBLIC_TOKEN_KEY = 'public_token';

export async function getServerToken(isBackoffice: boolean = false): Promise<string | null> {
  const tokenKey = isBackoffice ? BACKOFFICE_TOKEN_KEY : PUBLIC_TOKEN_KEY;
  const cookieStore = await cookies();
  const token = cookieStore.get(tokenKey);
  
  console.log('Server token check:', {
    tokenKey,
    hasToken: !!token,
    tokenValue: token?.value,
    tokenLength: token?.value?.length,
    tokenParts: token?.value?.split('.')
  });
  
  return token?.value || null;
} 