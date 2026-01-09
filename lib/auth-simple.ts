// lib/auth-simple.ts
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"

// Simple in-memory user for testing
const testUsers = [
  {
    id: "1",
    email: "admin@tikky.com",
    password: "admin123",
    name: "Admin User",
    role: "ADMIN"
  }
]

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("🔐 Auth attempt:", credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials")
          return null
        }

        // For now, use test user
        if (credentials.email === "admin@tikky.com" && credentials.password === "admin123") {
          console.log("✅ Using test user")
          return {
            id: "1",
            email: "admin@tikky.com",
            name: "Admin User",
            role: "ADMIN"
          }
        }

        // Try database lookup
        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (user && user.password) {
            // Simple password check for testing
            if (credentials.password === "admin123") {
              return {
                id: user.id,
                email: user.email,
                name: user.name || "",
                role: user.role || "USER"
              }
            }
          }
        } catch (error) {
          console.error("Database error:", error)
        }

        console.log("❌ Auth failed")
        return null
      }
    })
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
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "test-secret-for-development",
  debug: process.env.NODE_ENV === "development",
}
