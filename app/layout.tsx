import { Providers } from "./providers";
import "./globals.css"
import type { Metadata } from 'next';
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata: Metadata = {
  title: 'Tiky Events & Polls in Liberia',
  description: 'Discover and manage events in Liberia, create polls, and engage with your audience using Tiky, the premier event platform for Liberia. Whether you\'re an event organizer or an attendee, Tiky offers a seamless experience to connect, share, and participate in events across Liberia. Join Tiky today and be part of the vibrant event community in Liberia!',
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
        <SpeedInsights />
      </body>
    </html>
  );
}
