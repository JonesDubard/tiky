import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

// Email format validation
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase())
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,   // refresh token every 24h
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Basic presence check
        if (!credentials?.email || !credentials?.password) return null

        // Email format check — reject obviously invalid emails early
        if (!isValidEmail(credentials.email)) return null

        const email = credentials.email.trim().toLowerCase()

        const user = await prisma.user.findUnique({ where: { email } })

        // Always run bcrypt compare even when user not found to prevent
        // timing attacks that reveal whether an account exists
        const dummyHash = "$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345"
        const passwordToCheck = user?.password ?? dummyHash

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          passwordToCheck
        )

        if (!user || !user.password || !passwordMatch) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as "USER" | "ORGANIZER" | "ADMIN",
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role as "USER" | "ORGANIZER" | "ADMIN"
        session.user.id = token.id as string
      }
      return session
    },
  },
}