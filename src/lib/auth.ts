import CredentialsProvider from 'next-auth/providers/credentials'
import { AuthOptions, Session } from 'next-auth'
import { jwtDecode } from 'jwt-decode'
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';
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

const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith('https://') || !!process.env.VERCEL_URL;
const cookiePrefix = useSecureCookies ? '__Secure-' : '';

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    pkceCodeVerifier: {
      name: `${cookiePrefix}next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: useSecureCookies,
      },
    },
    state: {
      name: `${cookiePrefix}next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: useSecureCookies,
        maxAge: 900,
      },
    },
    nonce: {
      name: `${cookiePrefix}next-auth.nonce`,
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: useSecureCookies,
      },
    },
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter an email and password');
        }

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Authentication failed');
          }

          const data = await res.json();
          const decoded = jwtDecode<DecodedJWT>(data.accessToken);

          return {
            id: decoded.sub?.toString() || '',
            name: decoded.name || '',
            email: decoded.email || '',
            role: decoded.role || 'user',
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            gender: decoded.gender,
            birthDate: decoded.birthDate,
          };
        } catch (error) {
          if (error instanceof Error) {
            throw new Error(error.message);
          }
          throw new Error('Authentication failed');
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: 'openid email profile',
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
    AppleProvider({
      clientId: (process.env.APPLE_ID || '').trim(),
      clientSecret: (process.env.APPLE_PRIVATE_KEY || '').trim(),
      checks: ['state'], // Bypass PKCE to fix SameSite=lax cookie drop on Apple's form_post callback
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name ? `${profile.name.firstName} ${profile.name.lastName}` : '',
          email: profile.email || '',
          firstName: profile.name?.firstName || '',
          lastName: profile.name?.lastName || '',
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
    maxAge: 7 * 24 * 60 * 60, // 7 days - match backend access token expiration
    updateAge: 5 * 60, // Update session every 5 minutes
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
              origin: account.provider === 'google' ? 'google' : account.provider === 'apple' ? 'apple' : account.provider === 'facebook' ? 'facebook' : 'traditional',
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
              // Profile complete: set backend tokens and user data
              token.accessToken = data.access_token;
              token.refreshToken = data.refresh_token;
              token.profileIncomplete = false;

              // Update token with backend user data (including role)
              if (data.user) {
                token.role = data.user.role || token.role;
                token.name = data.user.name || token.name;
                token.email = data.user.email || token.email;
                token.firstName = data.user.firstName || token.firstName;
                token.lastName = data.user.lastName || token.lastName;
              }
            }
          }
        } catch (error) {
          console.error('[NextAuth JWT] Social login error:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      console.log('[NextAuth Session] Building session:', {
        hasToken: !!token,
        tokenKeys: token ? Object.keys(token) : [],
        hasAccessToken: !!(token as Record<string, unknown>)?.accessToken,
        hasRefreshToken: !!(token as Record<string, unknown>)?.refreshToken,
        tokenRole: (token as Record<string, unknown>)?.role,
        tokenSub: (token as Record<string, unknown>)?.sub
      });

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
      if (token.accessToken) {
        (session as ExtendedSession).accessToken = token.accessToken as string;
      }
      if (token.refreshToken) {
        (session as ExtendedSession).refreshToken = token.refreshToken as string;
      }

      if (typeof token.profileIncomplete === 'boolean') {
        (session as ExtendedSession).profileIncomplete = token.profileIncomplete;
      }

      if (token.registrationToken) {
        (session as ExtendedSession).registrationToken = token.registrationToken as string;
      }

      console.log('[NextAuth Session] Tokens and flags set:', {
        accessToken: !!(session as ExtendedSession).accessToken,
        refreshToken: !!(session as ExtendedSession).refreshToken,
        profileIncomplete: (session as ExtendedSession).profileIncomplete
      });

      // Use JWT token expiration instead of NextAuth's calculated expiration
      if (token.accessToken) {
        try {
          const decoded = jwtDecode<DecodedJWT>(token.accessToken as string);
          if (decoded.exp) {
            // Convert JWT expiration (seconds) to milliseconds and set session expiration
            session.expires = new Date(decoded.exp * 1000).toISOString();
            console.log('[NextAuth Session] Set expiration:', session.expires);
          }
        } catch (error) {
          console.error('Error decoding JWT for session expiration:', error);
        }
      }

      console.log('[NextAuth Session] Final session:', {
        userId: session.user.id,
        userRole: session.user.role,
        hasAccessToken: !!(session as ExtendedSession).accessToken,
        hasRefreshToken: !!(session as ExtendedSession).refreshToken,
        expires: session.expires
      });

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
// APPLE_ID, APPLE_TEAM_ID, APPLE_PRIVATE_KEY, APPLE_KEY_ID
//