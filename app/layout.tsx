import { Providers } from "./providers";
import "./globals.css";
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tiky – Events & Polls in Liberia',
  description: 'Discover and manage events, create polls, and engage with your audience using Tiky, the premier event platform for Liberia.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
            {children}
        </Providers>
      </body>
    </html>
  );
}
