import CredentialsProvider from 'next-auth/providers/credentials'
import { jwtDecode } from 'jwt-decode'
import { AuthOptions } from 'next-auth'

interface JWTUser {
  id: string
  name: string
  email: string
  role: string
  accessToken: string
}

export const authOptions: AuthOptions = {
  providers: [
    // — Usuario real (email/password) —
    CredentialsProvider({
      id: 'credentials',
      name: 'Usuario',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) return null

        // 1) Cabecera al endpoint de login
        const loginRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          }
        )
        if (!loginRes.ok) return null
        const { access_token } = await loginRes.json()

        // 2) Decode para pillar el role/sub
        const payload = jwtDecode<{ sub: string; role: string }>(
          access_token
        )

        // 3) Con el token, pedir perfil al backend
        const profileRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/me`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${access_token}`,
            },
          }
        )
        if (!profileRes.ok) return null
        const profile = await profileRes.json() as {
          id: number
          firstName: string
          lastName: string
          email: string
        }

        // 4) Devuelves todo junto
        const user: JWTUser = {
          id: profile.id.toString(),
          name: `${profile.firstName} ${profile.lastName}`,
          email: profile.email,
          role: payload.role,
          accessToken: access_token,
        }
        return user
      },
    }),

    // — Legacy Friends&Family —
    CredentialsProvider({
      id: 'legacy',               // asegúrate de ponerle un id único
      name: 'Legacy',
      credentials: {
        password:    { label: 'Password', type: 'password' },
        isBackoffice:{ label: 'Backoffice', type: 'text' } // OJO: siempre “text”
      },
      async authorize(credentials) {
        if (!credentials) return null

        // convertimos "true"/"false" a boolean
        const isBackoffice = credentials.isBackoffice === 'true'

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/login/legacy`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              password:     credentials.password,
              isBackoffice,
            }),
          }
        )
        if (!res.ok) return null

        const { access_token } = await res.json()
        const payload = jwtDecode<{ sub: string; role: string }>(access_token)

        return {
          id:          payload.sub,
          name:        '',
          email:       '',
          role:        payload.role,
          accessToken: access_token,
        } as JWTUser
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // En el token guardamos nuestro accessToken y role
      if (user) {
        token.accessToken = (user as JWTUser).accessToken
        token.role        = (user as JWTUser).role
      }
      return token
    },
    async session({ session, token }) {
      // Exponemos accessToken y role en session.user
      session.accessToken = token.accessToken as string
      session.user.id     = token.sub as string
      session.user.role   = token.role as string
      return session
    },
  },

  pages: {
    signIn: '/login', // o la ruta que uses para tu UI de login
  },
}