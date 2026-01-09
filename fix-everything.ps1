# fix-final.ps1
Write-Host "🔧 Fixing Tikky Platform..." -ForegroundColor Cyan

# 1. FIX TAILWIND CONFIG (MOST CRITICAL)
Write-Host "`n1. 🔥 FIXING TAILWIND CONFIG..." -ForegroundColor Red
@"
import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
export default config
"@ | Out-File -FilePath "tailwind.config.ts" -Encoding UTF8 -Force
Write-Host "✅ Fixed: tailwind.config.ts (was empty!)" -ForegroundColor Green

# 2. CHECK FOLDER NAMES
Write-Host "`n2. 📁 Checking folder names..." -ForegroundColor Yellow
if (Test-Path "app\public") {
    Rename-Item -Path "app\public" -NewName "(public)"
    Write-Host "✅ Renamed: public → (public)" -ForegroundColor Green
}
if (Test-Path "app\auth") {
    Rename-Item -Path "app\auth" -NewName "(auth)"
    Write-Host "✅ Renamed: auth → (auth)" -ForegroundColor Green
}

# 3. CREATE ESSENTIAL FILES
Write-Host "`n3. 📄 Creating missing files..." -ForegroundColor Yellow

# Root layout
@"
// app/layout.tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Tikky - Event Ticketing Platform",
  description: "Create, manage, and sell tickets for your events",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
"@ | Out-File -FilePath "app\layout.tsx" -Encoding UTF8 -Force
Write-Host "✅ Created: app/layout.tsx" -ForegroundColor Green

# Public layout
@"
// app/(public)/layout.tsx
import Providers from "./providers"
import Nav from "./components/Nav"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <Nav />
      <main>{children}</main>
    </Providers>
  )
}
"@ | Out-File -FilePath "app\(public)\layout.tsx" -Encoding UTF8 -Force
Write-Host "✅ Created: app/(public)/layout.tsx" -ForegroundColor Green

# Providers
@"
// app/(public)/providers.tsx
"use client"

import { SessionProvider } from "next-auth/react"

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
"@ | Out-File -FilePath "app\(public)\providers.tsx" -Encoding UTF8 -Force
Write-Host "✅ Created: app/(public)/providers.tsx" -ForegroundColor Green

# 4. UPDATE GLOBALS.CSS
Write-Host "`n4. 🎨 Setting up globals.css..." -ForegroundColor Yellow
@"
/* app/(public)/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
"@ | Out-File -FilePath "app\(public)\globals.css" -Encoding UTF8 -Force
Write-Host "✅ Created: app/(public)/globals.css" -ForegroundColor Green

# 5. FIX ADMIN LAYOUT (CRITICAL!)
Write-Host "`n5. 🛠️ Fixing Admin Layout..." -ForegroundColor Yellow
@"
// app/(auth)/admin/layout.tsx - SIMPLE VERSION
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  
  // Redirect if not logged in
  if (!session) {
    redirect('/login')
  }
  
  // Check if user has admin/organizer role
  const userRole = session.user?.role || 'USER'
  if (userRole !== 'ADMIN' && userRole !== 'ORGANIZER') {
    redirect('/unauthorized')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Tikky Admin</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Logged in as: {session.user?.email} ({userRole})
              </span>
              <form action="/api/auth/signout" method="POST">
                <button 
                  type="submit"
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
          
          {/* Simple navigation */}
          <nav className="mt-4 flex space-x-4">
            <a href="/admin" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              Dashboard
            </a>
            <a href="/admin/events" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              Events
            </a>
            <a href="/admin/polls" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              Polls
            </a>
            <a href="/admin/users" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              Users
            </a>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
"@ | Out-File -FilePath "app\(auth)\admin\layout.tsx" -Encoding UTF8 -Force
Write-Host "✅ Fixed: Admin layout (removed missing sidebar)" -ForegroundColor Green

# 6. GENERATE PRISMA CLIENT
Write-Host "`n6. 🗄️ Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate
Write-Host "✅ Prisma client generated" -ForegroundColor Green

Write-Host "`n🎉 ALL FIXES APPLIED!" -ForegroundColor Green
Write-Host "`n🚀 Start your dev server:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor White
Write-Host "`n🌐 Test these URLs:" -ForegroundColor Cyan
Write-Host "   Home: http://localhost:3000" -ForegroundColor White
Write-Host "   Login: http://localhost:3000/login" -ForegroundColor White
Write-Host "   Admin: http://localhost:3000/admin" -ForegroundColor White
Write-Host "`n🔑 Test credentials:" -ForegroundColor Cyan
Write-Host "   Email: admin@tikky.com" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White