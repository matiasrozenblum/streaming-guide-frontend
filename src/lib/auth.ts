import CredentialsProvider from 'next-auth/providers/credentials'
import { jwtDecode } from 'jwt-decode'
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

const API_URL = process.env.NEXT_PUBLIC_API_URL as string

export const authOptions: AuthOptions = {
  providers: [
    // — Usuario real (email/password) o registro (accessToken directo) —
    CredentialsProvider({
      id: 'credentials',
      name: 'Usuario',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
        accessToken: { label: 'Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials) return null

        let access_token: string

        // Si viene de registro o verificación, usamos el token ya obtenido
        if (credentials.accessToken) {
          access_token = credentials.accessToken
        } else {
          // Login clásico con email + password
          const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })
          if (!res.ok) return null
          const body = await res.json()
          access_token = body.access_token
        }

        // Decodificar para extraer sub (id), role, gender, birthDate
        const payload = jwtDecode<{ sub: string; role: string; gender?: string; birthDate?: string }>(access_token)

        // Obtener perfil del usuario
        const profileRes = await fetch(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${access_token}` },
        })
        if (!profileRes.ok) return null
        const profile = await profileRes.json() as {
          id: number
          firstName: string
          lastName: string
          email: string
          gender?: string
          birthDate?: string
        }

        return {
          id:          profile.id.toString(),
          name:        `${profile.firstName} ${profile.lastName}`,
          email:       profile.email,
          role:        payload.role,
          accessToken: access_token,
          gender:      payload.gender || profile.gender,
          birthDate:   payload.birthDate || profile.birthDate,
        } as JWTUser
      },
    }),

    // — Legacy Friends&Family —
    CredentialsProvider({
      id: 'legacy',
      name: 'Legacy',
      credentials: {
        password:     { label: 'Password', type: 'password' },
        isBackoffice: { label: 'Backoffice', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials) return null
        const isBackoffice = credentials.isBackoffice === 'true'

        const res = await fetch(`${API_URL}/auth/login/legacy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password: credentials.password,
            isBackoffice,
          }),
        })
        if (!res.ok) return null
        const { access_token } = await res.json()
        const payload = jwtDecode<{ sub: string; role: string }>(access_token)

        // Legacy no trae perfil, sólo guardamos role
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
        token.gender      = (user as JWTUser).gender
        token.birthDate   = (user as JWTUser).birthDate
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.user.id     = token.sub as string
      session.user.role   = token.role as string
      session.user.name   = session.user.name || ''
      session.user.gender    = token.gender as string
      session.user.birthDate = token.birthDate as string
      return session
    },
  },

  pages: {
    signIn: '/login', // o la ruta que uses para tu UI de login
  },
}
