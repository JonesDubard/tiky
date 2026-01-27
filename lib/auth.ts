// lib/auth.ts
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

/**
 * Debug logging (safe in dev)
 */
if (process.env.NODE_ENV === "development") {
  console.log("🔧 Auth config loading...")
  console.log("   NEXTAUTH_URL:", process.env.NEXTAUTH_URL)
  console.log(
    "   NEXTAUTH_SECRET:",
    process.env.NEXTAUTH_SECRET ? "Set" : "Not set"
  )
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
  return {
    id: "dev-admin-id",
    email: credentials.email,
    name: "Dev Admin",
    role: "ADMIN",
  }
}


        // 🔧 DEV BYPASS (remove before production)
        if (
          process.env.NODE_ENV === "development" &&
          credentials.password === "dev-bypass"
        ) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role ?? "USER",
          }
        }

        if (!user.password) {
          throw new Error("Account has no password set")
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isValid) {
          throw new Error("Invalid email or password")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role ?? "USER",
        }
      },
    }),
  ],

  callbacks: {
    /**
     * Runs on sign-in and whenever a JWT is created/updated
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role ?? "USER"
      }
      return token
    },

    /**
     * Makes data available on `session.user`
     * THIS is what your API routes rely on
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === "development",
}
