# fix-navbar.ps1
Write-Host "🔧 Fixing Navbar Issues..." -ForegroundColor Cyan

# 1. Check what Nav component exists
Write-Host "`n1. Checking existing Nav components..." -ForegroundColor Yellow

if (Test-Path "app\(public)\components\Nav.tsx") {
    Write-Host "✅ Found: Nav.tsx" -ForegroundColor Green
    
    # Option 2: Update layout to use Nav
    Write-Host "`n2. Updating layout to use Nav component..." -ForegroundColor Yellow
    @'
// app/(public)/layout.tsx - FIXED VERSION
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
'@ | Out-File -FilePath "app\(public)\layout.tsx" -Encoding UTF8 -Force
    Write-Host "✅ Updated layout.tsx to import Nav" -ForegroundColor Green
    
} elseif (Test-Path "app\(public)\components\Navbar.tsx") {
    Write-Host "✅ Found: Navbar.tsx" -ForegroundColor Green
} else {
    Write-Host "❌ No Nav component found! Creating one..." -ForegroundColor Red
    
    # Create a basic Nav component
    @'
// app/(public)/components/Nav.tsx
"use client"

import Link from "next/link"
import { Bell, Sun, User } from "lucide-react"

export default function Nav() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6B35] to-orange-500 flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-sm">T</span>
          </div>
          <Link href="/" className="text-xl font-black tracking-tight hover:opacity-80">
            TIKKY
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          
          {/* Poll Icon */}
          <button
            className="p-2 rounded-full hover:bg-gray-100 active:scale-95 transition"
            aria-label="Live Polls"
          >
            <Bell className="w-5 h-5 text-gray-700" />
          </button>

          {/* Dark Mode Toggle */}
          <button
            className="p-2 rounded-full hover:bg-gray-100 active:scale-95 transition"
            aria-label="Toggle Dark Mode"
          >
            <Sun className="w-5 h-5 text-gray-700" />
          </button>

          {/* Avatar/Login */}
          <Link
            href="/login"
            className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center hover:ring-2 hover:ring-[#FF6B35]/40 transition"
            aria-label="User Profile"
          >
            <User className="w-5 h-5 text-gray-600" />
          </Link>
        </div>
      </div>
    </nav>
  )
}
'@ | Out-File -FilePath "app\(public)\components\Nav.tsx" -Encoding UTF8
    Write-Host "✅ Created Nav.tsx component" -ForegroundColor Green
}

# 2. Check and fix globals.css path
Write-Host "`n3. Checking globals.css..." -ForegroundColor Yellow
if (Test-Path "app\(public)\globals.css") {
    Write-Host "✅ globals.css exists" -ForegroundColor Green
} else {
    # Create basic globals.css
    @'
/* app/(public)/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
'@ | Out-File -FilePath "app\(public)\globals.css" -Encoding UTF8
    Write-Host "✅ Created globals.css" -ForegroundColor Green
}

# 3. Check and fix root layout
Write-Host "`n4. Checking root layout..." -ForegroundColor Yellow
if (Test-Path "app\layout.tsx") {
    $rootLayout = Get-Content "app\layout.tsx" -Raw
    if ($rootLayout -match "globals.css") {
        Write-Host "✅ Root layout has globals.css import" -ForegroundColor Green
    } else {
        # Update root layout
        @'
// app/layout.tsx - UPDATED
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
'@ | Out-File -FilePath "app\layout.tsx" -Encoding UTF8 -Force
        Write-Host "✅ Updated root layout" -ForegroundColor Green
    }
}

# 4. Update globals.css path in root layout
Write-Host "`n5. Fixing globals.css import path..." -ForegroundColor Yellow
$rootContent = Get-Content "app\layout.tsx" -Raw
$rootContent = $rootContent -replace 'import "./globals.css"', 'import "./(public)/globals.css"'
Set-Content -Path "app\layout.tsx" -Value $rootContent -Encoding UTF8
Write-Host "✅ Fixed globals.css import path" -ForegroundColor Green

Write-Host "`n🎉 NAVBAR ISSUES FIXED!" -ForegroundColor Green
Write-Host "`n🚀 Restart dev server: npm run dev" -ForegroundColor Cyan