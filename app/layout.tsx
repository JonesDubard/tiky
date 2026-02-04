// app/layout.tsx - UPDATED WITH CORRECT PATHS
import "./globals.css"
import { ThemeProvider } from "../components/providers/theme-provider"
import Providers from "@/(public)/providers"  

export const metadata = {
  title: "Tiky - Discover events in Liberia",
  description: "Tiky is your gateway to discovering and booking events across Liberia",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-black dark:bg-zinc-950 dark:text-zinc-100 antialiased">
        <ThemeProvider>
          <Providers>
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}