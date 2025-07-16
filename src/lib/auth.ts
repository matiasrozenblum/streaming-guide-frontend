import CredentialsProvider from 'next-auth/providers/credentials'
import { AuthOptions, Session } from 'next-auth'
import { jwtDecode } from 'jwt-decode'
import { signOut } from 'next-auth/react'
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';

interface ExtendedSession extends Session {
  accessToken: string;
  refreshToken: string;
  profileIncomplete?: boolean;
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
      console.log('[NextAuth JWT] JWT callback called with:', {
        hasToken: !!token,
        hasUser: !!user,
        hasAccount: !!account,
        accountProvider: account?.provider,
        tokenEmail: token.email,
        tokenSub: token.sub
      });
      
      // On login, persist tokens and profile info
      if (user) {
        console.log('[NextAuth JWT] User object present:', user);
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
        console.log('[NextAuth JWT] Processing social login for provider:', account.provider);
        console.log('[NextAuth JWT] Token email:', token.email);
        console.log('[NextAuth JWT] Current token.sub:', token.sub);
        
        try {
          // Always call social login to create/update user
          const socialLoginUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/social-login`;
          console.log('[NextAuth JWT] Calling social login at:', socialLoginUrl);
          
          const socialLoginRes = await fetch(socialLoginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: account.provider,
              accessToken: account.access_token,
              user: {
                email: token.email,
                firstName: token.firstName || token.name?.split(' ')[0] || '',
                lastName: token.lastName || token.name?.split(' ').slice(1).join(' ') || '',
              },
            }),
          });
          
          console.log('[NextAuth JWT] Social login response status:', socialLoginRes.status);
          
          if (socialLoginRes.ok) {
            const socialData = await socialLoginRes.json();
            console.log('[NextAuth JWT] Social login successful:', socialData);
            
            if (socialData.user && socialData.user.id) {
              token.sub = socialData.user.id.toString();
              console.log('[NextAuth JWT] Set token.sub to:', token.sub);
            }
            
            // Store the profile incomplete status for later use
            token.profileIncomplete = socialData.profileIncomplete;
            console.log('[NextAuth JWT] Profile incomplete:', token.profileIncomplete);
            
            // If we have backend tokens, use them instead of the social tokens
            if (socialData.access_token && socialData.refresh_token) {
              token.accessToken = socialData.access_token;
              token.refreshToken = socialData.refresh_token;
              console.log('[NextAuth JWT] Updated with backend tokens');
            }
          } else {
            console.log('[NextAuth JWT] Social login failed:', socialLoginRes.status);
            const errorText = await socialLoginRes.text();
            console.log('[NextAuth JWT] Social login error response:', errorText);
          }
        } catch (error) {
          console.log('[NextAuth JWT] Error in social login flow:', error);
        }
      } else if (token.email && token.sub && token.sub.toString().length > 10) {
        // We have a social provider ID, we need to look up the backend user
        console.log('[NextAuth JWT] Have social provider ID, looking up backend user');
        console.log('[NextAuth JWT] Current token.sub:', token.sub);
        try {
          const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/users/email/${encodeURIComponent(token.email)}`;
          const res = await fetch(apiUrl);
          if (res.ok) {
            const backendUser = await res.json();
            if (backendUser && backendUser.id) {
              token.sub = backendUser.id.toString();
              console.log('[NextAuth JWT] Found user ID on subsequent call:', token.sub);
            }
          }
        } catch (error) {
          console.log('[NextAuth JWT] Error looking up user on subsequent call:', error);
        }
      } else if (token.sub && token.profileIncomplete) {
        // Check if profile is now complete (user has gender and birthDate)
        console.log('[NextAuth JWT] Checking if profile is now complete for user:', token.sub);
        try {
          const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/users/${token.sub}`;
          const res = await fetch(apiUrl);
          if (res.ok) {
            const backendUser = await res.json();
            if (backendUser.gender && backendUser.birthDate) {
              console.log('[NextAuth JWT] Profile is now complete, removing profileIncomplete flag');
              token.profileIncomplete = false;
            }
          }
        } catch (error) {
          console.log('[NextAuth JWT] Error checking profile completion:', error);
        }
      } else {
        console.log('[NextAuth JWT] Not a social login or missing email. Account provider:', account?.provider, 'Token email:', token.email);
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
      console.log('[NextAuth Session] Session callback called with token.sub:', token.sub);
      console.log('[NextAuth Session] Token profileIncomplete:', token.profileIncomplete);
      
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
        const subStr = token.sub?.toString() || '';
        if (subStr.length <= 10) {
          // This looks like a valid backend user ID
          session.user.id = token.sub as string;
          console.log('[NextAuth Session] Set session.user.id to:', session.user.id);
        } else {
          // This is a social provider ID, we need to look up the backend user
          console.log('[NextAuth Session] Detected social provider ID, looking up backend user');
          try {
            const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/users/email/${encodeURIComponent(token.email || '')}`;
            const res = await fetch(apiUrl);
            if (res.ok) {
              const backendUser = await res.json();
              if (backendUser && backendUser.id) {
                session.user.id = backendUser.id.toString();
                console.log('[NextAuth Session] Found backend user ID:', session.user.id);
              }
            }
          } catch (error) {
            console.log('[NextAuth Session] Error looking up backend user:', error);
          }
        }
      }
      
      // Add profile incomplete status to session
      if (token?.profileIncomplete) {
        extendedSession.profileIncomplete = token.profileIncomplete as boolean;
        console.log('[NextAuth Session] Set profileIncomplete to:', extendedSession.profileIncomplete);
      }
      
      console.log('[NextAuth Session] Final session.user.id:', session.user.id);
      return session;
    },
  },
  pages: {
    signIn: '/',
    newUser: '/profile',
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