// app/layout.tsx - WITH PROVIDERS
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./(public)/globals.css"
import Providers from "./(public)/providers"

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
      <body className="antialiased" suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
