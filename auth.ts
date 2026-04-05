import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs" 
import { prisma } from "./lib/db"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      // Cambiamos email por matricula ya que el email ahora es opcional en tu schema
      credentials: {
        email: { label: "Correo Electrónico", type: "email", placeholder: "alumno@escuela.edu" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        // 1. Validar que vengan los datos
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Faltan credenciales.")
        }

        // 2. Buscar al usuario en la BD usando Prisma
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user) {
          // No se encontró el usuario
          throw new Error("Credenciales inválidas.")
        }

        // 3. Lógica para verificar el hash de la contraseña
        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isValidPassword) {
          throw new Error("Credenciales inválidas.")
        }

        // 4. Validar el estado del usuario usando tu enum
        if (user.status !== "ACTIVO") {
          throw new Error("Cuenta inactiva o suspendida.")
        }

        // 5. Retornar el objeto de usuario con la data de su perfil
        // Este objeto es el que Auth.js toma para inyectar en el token
        return {
          id: user.id,
          name: `${user.nombre} ${user.apellidos}`,
          email: user.email, 
          role: user.role,
          matricula: user.matricula,
          status: user.status
        }
      },
    }),
  ],
  callbacks: {
    // Necesitamos estos callbacks para que tu middleware pueda leer el rol
    async jwt({ token, user }) {
      if (user) {
        // Extendemos el token con los campos personalizados de tu BD
        token.id = user.id as string
        token.role = user.role
        token.matricula = user.matricula
        token.status = user.status
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        // Pasamos los datos del token a la sesión del cliente
        session.user.id = token.id as string
        session.user.role = token.role as any
        session.user.matricula = token.matricula as string
        session.user.status = token.status as any
      }
      return session
    }
  },
  pages: {
    signIn: '/login', // Redirigir aquí si hay errores o no hay sesión
  }
})