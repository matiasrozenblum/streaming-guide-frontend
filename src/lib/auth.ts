import CredentialsProvider from 'next-auth/providers/credentials'
import { AuthOptions } from 'next-auth'
import { jwtDecode } from 'jwt-decode'

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
      return token;
    },
    async session({ session, token }) {
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
}
