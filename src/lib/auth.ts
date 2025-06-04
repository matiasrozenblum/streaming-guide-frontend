import CredentialsProvider from 'next-auth/providers/credentials'
import { AuthOptions, Session } from 'next-auth'
import { jwtDecode } from 'jwt-decode'
import { signOut } from 'next-auth/react'

interface ExtendedSession extends Session {
  accessToken: string;
  refreshToken: string;
}

interface JWTUser {
  id: string
  name: string
  email: string
  role: string
  accessToken: string
  refreshToken: string
  gender?: string
  birthDate?: string
}

interface DecodedJWT {
  sub?: string | number;
  name?: string;
  email?: string;
  role?: string;
  gender?: string;
  birthDate?: string;
  exp?: number;
  [key: string]: unknown;
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        accessToken: { label: 'Access Token', type: 'text' },
        refreshToken: { label: 'Refresh Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.accessToken) return null;
        const decoded = jwtDecode<DecodedJWT>(credentials.accessToken);
        return {
          id: decoded.sub?.toString() || '',
          name: decoded.name || '',
          email: decoded.email || '',
          role: decoded.role || 'user',
          accessToken: credentials.accessToken,
          refreshToken: credentials.refreshToken || '',
          gender: decoded.gender,
          birthDate: decoded.birthDate,
        } as JWTUser;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 14 * 24 * 60 * 60, // 14 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // On login, persist tokens
      if (user) {
        token.accessToken = (user as JWTUser).accessToken;
        token.refreshToken = (user as JWTUser).refreshToken;
        token.role = (user as JWTUser).role;
        token.gender = (user as JWTUser).gender;
        token.birthDate = (user as JWTUser).birthDate;
        token.name = (user as JWTUser).name;
        token.email = (user as JWTUser).email;
        token.sub = (user as JWTUser).id;
      }
      // Check if access token is about to expire
      if (token.accessToken && token.refreshToken) {
        const decoded = jwtDecode<DecodedJWT>(token.accessToken as string);
        const exp = decoded.exp ? decoded.exp * 1000 : 0;
        const now = Date.now();
        if (exp - now < 5 * 60 * 1000) { // less than 5 min left
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token.refreshToken}`,
              },
            });
            if (res.ok) {
              const data = await res.json();
              token.accessToken = data.access_token;
              token.refreshToken = data.refresh_token || token.refreshToken;
            } else {
              await signOut({ redirect: true, callbackUrl: '/' });
              return { ...token, error: 'RefreshAccessTokenError' };
            }
          } catch {
            await signOut({ redirect: true, callbackUrl: '/' });
            return { ...token, error: 'RefreshAccessTokenError' };
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      const extendedSession = session as ExtendedSession;
      extendedSession.accessToken = token.accessToken as string;
      extendedSession.refreshToken = token.refreshToken as string;
      session.user = {
        ...session.user,
        id: (token.sub as string) || '',
        name: (token.name as string) || '',
        email: (token.email as string) || '',
        role: (token.role as string) || 'user',
        gender: (token.gender as string) || undefined,
        birthDate: (token.birthDate as string) || undefined,
      };
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  events: {
    async signOut() {
      await fetch('/api/auth/logout', { method: 'POST' });
    },
  },
};
