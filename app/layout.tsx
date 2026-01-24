import "./globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { Providers } from "@/components/providers/session-provider"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-black dark:bg-zinc-950 dark:text-zinc-100 antialiased transition-colors">
        <ThemeProvider>
          <Providers>
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
