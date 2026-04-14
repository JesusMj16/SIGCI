import { DefaultSession, DefaultUser } from "next-auth"
import { DefaultJWT } from "next-auth/jwt"
import { UserRole, UserStatus } from "@prisma/client" 

declare module "next-auth" {
  /*Extender el objeto de Sesión */
  interface Session {
    user: {
      id: string
      role: UserRole
      matricula: string
      status: UserStatus
    } & DefaultSession["user"]
  }

  /* Extender el objeto User (lo que devuelve en el callback authorize)*/
  interface User extends DefaultUser {
    role: UserRole
    matricula: string
    status: UserStatus
  }
}

declare module "next-auth/jwt" {
  /* Extender el objeto del Token JWT (usado en los callbacks y en el middleware)*/
  interface JWT extends DefaultJWT {
    id: string
    role: UserRole
    matricula: string
    status: UserStatus
  }
}