import CredentialsProvider from 'next-auth/providers/credentials'
import { AuthOptions } from 'next-auth'
import { jwtDecode } from 'jwt-decode'
import { signOut } from 'next-auth/react'

interface JWTUser {
  id: string
  name: string
  email: string
  role: string
  accessToken: string
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
      },
      async authorize(credentials) {
        if (!credentials?.accessToken) return null;
        const decoded: DecodedJWT = jwtDecode<DecodedJWT>(credentials.accessToken);
        return {
          id: decoded.sub?.toString() || '',
          name: decoded.name || '',
          email: decoded.email || '',
          role: decoded.role || 'user',
          accessToken: credentials.accessToken,
          gender: decoded.gender,
          birthDate: decoded.birthDate,
        } as JWTUser;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as JWTUser).accessToken;
        token.role = (user as JWTUser).role;
        token.gender = (user as JWTUser).gender;
        token.birthDate = (user as JWTUser).birthDate;
        token.name = (user as JWTUser).name;
        token.email = (user as JWTUser).email;
        token.sub = (user as JWTUser).id;
      }

      // Check if token needs refresh
      if (token.accessToken) {
        const decoded = jwtDecode<DecodedJWT>(token.accessToken as string);
        const shouldRefresh = decoded.exp ? decoded.exp * 1000 < Date.now() + 5 * 60 * 1000 : false;

        if (shouldRefresh) {
          try {
            const response = await fetch('/api/auth/refresh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
              const data = await response.json();
              token.accessToken = data.access_token;
            } else {
              // If refresh fails, sign out the user
              await signOut({ redirect: true, callbackUrl: '/' });
              return { ...token, error: 'RefreshAccessTokenError' };
            }
          } catch (error) {
            console.error('Failed to refresh token:', error);
            // If refresh fails, sign out the user
            await signOut({ redirect: true, callbackUrl: '/' });
            return { ...token, error: 'RefreshAccessTokenError' };
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.error === 'RefreshAccessTokenError') {
        return session;
      }
      
      session.accessToken = token.accessToken as string;
      session.user.id = token.sub as string;
      session.user.role = token.role as string;
      session.user.name = token.name as string || '';
      session.user.email = token.email as string || '';
      session.user.gender = token.gender as string;
      session.user.birthDate = token.birthDate as string;
      return session;
    },
  },

  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: 14 * 24 * 60 * 60, // 14 days
  },
  events: {
    async signOut() {
      // Clear refresh token cookie on sign out
      await fetch('/api/auth/logout', { method: 'POST' });
    },
  },
}
