import CredentialsProvider from 'next-auth/providers/credentials'
import { AuthOptions, Session } from 'next-auth'
import { jwtDecode } from 'jwt-decode'
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';

interface ExtendedSession extends Session {
  accessToken: string;
  refreshToken: string;
  profileIncomplete?: boolean;
  registrationToken?: string;
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
        token.firstName = (user as MaybeNamedUser)?.firstName || token.firstName || (user.name?.split(' ')[0] ?? '');
        token.lastName = (user as MaybeNamedUser)?.lastName || token.lastName || (user.name?.split(' ').slice(1).join(' ') ?? '');
        token.image = user.image || token.image;
      }

      // Handle social login: call backend /auth/social-login immediately after OAuth
      if (account?.provider && token.email) {
        try {
          const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/social-login`;
          const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: token.email,
              firstName: token.firstName || token.name?.split(' ')[0] || '',
              lastName: token.lastName || token.name?.split(' ').slice(1).join(' ') || '',
              provider: account.provider,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.profileIncomplete && data.registration_token) {
              // Profile incomplete: store registration token and flag
              token.registrationToken = data.registration_token;
              token.profileIncomplete = true;
              token.sub = data.user.id.toString();
            } else if (data.access_token && data.refresh_token) {
              // Profile complete: store backend tokens and user ID
              token.accessToken = data.access_token;
              token.refreshToken = data.refresh_token;
              token.sub = data.user.id.toString();
              token.profileIncomplete = false;
            }
          } else {
            // If backend call fails, do not set tokens
            token.profileIncomplete = true;
          }
        } catch {
          // If backend call fails, do not set tokens
          token.profileIncomplete = true;
        }
      }

      // Refresh backend token if about to expire
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
              token.refreshToken = data.refresh_token;
            }
          } catch {
            // Ignore refresh errors here
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Always set backend user ID if available
      if (token.sub) {
        session.user.id = token.sub.toString();
      }

      // Set role from token
      if (token.role) {
        session.user.role = token.role as string;
      }

      // If we have profileIncomplete flag but also have backend tokens, the profile was completed
      if (token.profileIncomplete && token.accessToken && token.refreshToken) {
        console.log('[NextAuth Session] Profile was completed, updating session');
        (session as ExtendedSession).accessToken = token.accessToken as string;
        (session as ExtendedSession).refreshToken = token.refreshToken as string;
        (session as ExtendedSession).profileIncomplete = false;
        return session;
      }

      // Pass through registrationToken and profileIncomplete
      if (token.profileIncomplete) {
        (session as ExtendedSession).profileIncomplete = true;
        (session as ExtendedSession).registrationToken = token.registrationToken as string;
        // Do not set backend tokens yet
        return session;
      }

      // If profile is complete, set backend tokens and user info
      if (token.accessToken && token.refreshToken) {
        (session as ExtendedSession).accessToken = token.accessToken as string;
        (session as ExtendedSession).refreshToken = token.refreshToken as string;
        (session as ExtendedSession).profileIncomplete = false;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
};

// Required ENV variables:
// GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
// FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET
//