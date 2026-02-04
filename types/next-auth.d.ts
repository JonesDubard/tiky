// types/next-auth.d.ts
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "USER" | "ORGANIZER" | "ADMIN"
    } & DefaultSession["user"]
  }

  interface User {
    role: "USER" | "ORGANIZER" | "ADMIN"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: "USER" | "ORGANIZER" | "ADMIN"
  }
}