import CredentialsProvider from 'next-auth/providers/credentials'
import { AuthOptions, Session } from 'next-auth'
import { jwtDecode } from 'jwt-decode'
import { signOut } from 'next-auth/react'
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';

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

type MaybeNamedUser = { firstName?: string; lastName?: string; name?: string };

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
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      },
      profile(profile) {
        // Google returns name, email, picture, sometimes given_name/family_name
        return {
          id: profile.sub || profile.id,
          name: profile.name || '',
          email: profile.email || '',
          firstName: profile.given_name || '',
          lastName: profile.family_name || '',
          image: profile.picture || '',
          // gender, birthDate, phone are not provided by default
        };
      },
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'email public_profile'
        }
      },
      profile(profile) {
        // Facebook returns id, name, email, picture, sometimes first_name/last_name
        return {
          id: profile.id,
          name: profile.name || '',
          email: profile.email || '',
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          image: profile.picture?.data?.url || '',
          // gender, birthDate, phone are not provided by default
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 14 * 24 * 60 * 60, // 14 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // On login, persist tokens and profile info
      if (user) {
        const u = user as JWTUser;
        token.accessToken = u.accessToken || token.accessToken;
        token.refreshToken = u.refreshToken || token.refreshToken;
        token.role = u.role || token.role || 'user';
        token.gender = u.gender || token.gender;
        token.birthDate = u.birthDate || token.birthDate;
        token.name = u.name || token.name;
        token.email = u.email || token.email;
        // Social providers: extract first/last name if available
        token.firstName = (user as MaybeNamedUser)?.firstName || token.firstName || (user.name?.split(' ')[0] ?? '');
        token.lastName = (user as MaybeNamedUser)?.lastName || token.lastName || (user.name?.split(' ').slice(1).join(' ') ?? '');
        token.image = user.image || token.image;
      }
      // After social login, map session user.id to backend user ID
      if (account?.provider && token.email) {
        try {
          const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/users/email/${encodeURIComponent(token.email)}`;
          const res = await fetch(apiUrl);
          if (res.ok) {
            const backendUser = await res.json();
            if (backendUser && backendUser.id) {
              token.sub = backendUser.id.toString();
            }
          }
        } catch {}
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
        firstName: (token.firstName as string) || '',
        lastName: (token.lastName as string) || '',
        image: (token.image as string) || '',
      };
      // Set session.user.id to backend user ID
      if (token?.sub) {
        session.user.id = token.sub;
      }
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

// Required ENV variables:
// GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
// FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET
//
