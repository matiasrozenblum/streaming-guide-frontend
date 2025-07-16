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
        tokenSub: token.sub,
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
      
      // After social login, create user in backend
      if (account?.provider && token.email && !token.accessToken) {
        console.log('[NextAuth JWT] Processing social login for provider:', account.provider);
        console.log('[NextAuth JWT] Token email:', token.email);
        
        try {
          // Call our social login endpoint to create user
          const socialLoginRes = await fetch('/api/auth/social-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: token.email,
              firstName: token.firstName || token.name?.split(' ')[0] || '',
              lastName: token.lastName || token.name?.split(' ').slice(1).join(' ') || '',
              provider: account.provider,
            }),
          });
          
          console.log('[NextAuth JWT] Social login response status:', socialLoginRes.status);
          
          if (socialLoginRes.ok) {
            const socialData = await socialLoginRes.json();
            console.log('[NextAuth JWT] Social login successful:', socialData);
            
            // Set the backend user ID
            if (socialData.user && socialData.user.id) {
              token.sub = socialData.user.id.toString();
              console.log('[NextAuth JWT] Set token.sub to backend user ID:', token.sub);
            }
            
            // Store the profile incomplete status
            token.profileIncomplete = socialData.profileIncomplete;
            console.log('[NextAuth JWT] Profile incomplete:', token.profileIncomplete);
            
            // If we have backend tokens, use them
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
              token.refreshToken = data.refresh_token;
            } else {
              // Refresh failed, sign out
              await signOut({ redirect: false });
            }
          } catch (error) {
            console.error('Token refresh error:', error);
            await signOut({ redirect: false });
          }
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      console.log('[NextAuth Session] Session callback called with token.sub:', token.sub);
      
      // Map session user.id to backend user ID
      if (token.sub && token.sub.toString().length < 10) {
        // This is a backend user ID (small number)
        session.user.id = token.sub.toString();
      } else if (token.email) {
        // This might be a social provider ID, try to look up backend user
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/email/${encodeURIComponent(token.email)}`);
          if (res.ok) {
            const backendUser = await res.json();
            if (backendUser && backendUser.id) {
              session.user.id = backendUser.id.toString();
              console.log('[NextAuth Session] Found backend user ID:', session.user.id);
            }
          }
        } catch (error) {
          console.log('[NextAuth Session] Error looking up user:', error);
        }
      }
      
      // Add backend tokens to session
      (session as ExtendedSession).accessToken = token.accessToken as string;
      (session as ExtendedSession).refreshToken = token.refreshToken as string;
      (session as ExtendedSession).profileIncomplete = token.profileIncomplete as boolean;
      
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