// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "lib/prisma";
import bcrypt from "bcryptjs";

// Type definitions
type Role = "ADMIN" | "ORGANIZER" | "USER";

declare module "next-auth" {
  interface User {
    role: Role;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: Role;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    id: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // ------------------- Email + Password Provider (existing) -------------------
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as Role,
        };
      },
    }),

    // ------------------- Phone + OTP Provider (Twilio) -------------------
    CredentialsProvider({
      id: "phone-otp",
      name: "Phone OTP",
      credentials: {
        phone: { label: "Phone Number", type: "tel" },
        code: { label: "Verification Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.code) {
          throw new Error("Phone and code are required");
        }

        // Call your internal Twilio verification endpoint
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const verifyRes = await fetch(`${baseUrl}/api/auth/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: credentials.phone,   // matches verify-otp endpoint
            code: credentials.code,
          }),
        });

        const verifyData = await verifyRes.json();

        if (!verifyRes.ok || !verifyData.success) {
          throw new Error(verifyData.error || "Invalid verification code");
        }

        // Find or create user by phone number
        let user = await prisma.user.findFirst({
          where: { phoneNumber: credentials.phone },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phoneVerified: true,
          },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              phoneNumber: credentials.phone,
              phoneVerified: true,
              role: "USER",
              status: "active",
              email: `phone_${credentials.phone.replace(/[^0-9]/g, "")}@temp.tiky.com`,
              name: null,
            },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              phoneVerified: true,
            },
          });
        } else if (!user.phoneVerified) {
          // Mark as verified if not already
          await prisma.user.update({
            where: { id: user.id },
            data: { phoneVerified: true },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as Role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };