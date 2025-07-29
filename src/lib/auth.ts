import CredentialsProvider from 'next-auth/providers/credentials'
import { AuthOptions, Session } from 'next-auth'
import { jwtDecode } from 'jwt-decode'
import GoogleProvider from 'next-auth/providers/google';
// import FacebookProvider from 'next-auth/providers/facebook'; // Temporarily disabled - requires app review

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
  secret: process.env.NEXTAUTH_SECRET,
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
    // FacebookProvider temporarily disabled - requires app review
    /*
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
    */
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
              origin: account.provider === 'google' ? 'google' : account.provider === 'facebook' ? 'facebook' : 'traditional',
            }),
          });

          if (res.ok) {
            const data = await res.json();

            // Always set the backend user ID
            token.sub = data.user.id.toString();

            if (data.profileIncomplete) {
              // Profile incomplete: set flag and redirect to profile
              token.profileIncomplete = true;
              token.registrationToken = data.registration_token;
            } else {
              // Profile complete: set backend tokens
              token.accessToken = data.access_token;
              token.refreshToken = data.refresh_token;
              token.profileIncomplete = false;
            }
          }
        } catch (error) {
          console.error('[NextAuth JWT] Social login error:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Set backend user ID
      if (token.sub) {
        session.user.id = token.sub.toString();
      }

      // Set role from token
      if (token.role) {
        session.user.role = token.role as string;
      }

      // Set user profile data from token
      if (token.gender) {
        session.user.gender = token.gender as string;
      }
      if (token.birthDate) {
        session.user.birthDate = token.birthDate as string;
      }
      if (token.firstName) {
        session.user.firstName = token.firstName as string;
      }
      if (token.lastName) {
        session.user.lastName = token.lastName as string;
      }

      // Set backend tokens and profile status
      if (token.accessToken && token.refreshToken) {
        (session as ExtendedSession).accessToken = token.accessToken as string;
        (session as ExtendedSession).refreshToken = token.refreshToken as string;
        (session as ExtendedSession).profileIncomplete = false;
      } else if (token.profileIncomplete) {
        (session as ExtendedSession).profileIncomplete = true;
        (session as ExtendedSession).registrationToken = token.registrationToken as string;
      }

      return session;
    },
  },
  pages: {
    signIn: '/sign-in',
    newUser: '/profile'
  },
};

// Required ENV variables:
// GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
// FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET
//