import CredentialsProvider from 'next-auth/providers/credentials'
import { AuthOptions } from 'next-auth'

interface JWTUser {
  id: string
  name: string
  email: string
  role: string
  accessToken: string
  gender?: string
  birthDate?: string
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
        return {
          id: 'user',
          name: '',
          email: '',
          role: 'user',
          accessToken: credentials.accessToken,
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
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.id = token.sub as string;
      session.user.role = token.role as string;
      session.user.name = session.user.name || '';
      session.user.gender = token.gender as string;
      session.user.birthDate = token.birthDate as string;
      return session;
    },
  },

  pages: {
    signIn: '/login',
  },
}
