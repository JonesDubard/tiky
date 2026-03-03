
// ─── app/(public)/components/home/HeroSection.tsx ────────────────────────────

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const content = (
    <div className="text-center max-w-4xl mx-auto">
      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 leading-tight tracking-tight">
        <span className="text-gray-900">Events in </span>
        <span className="text-brand-primary">Liberia</span>
        <br />
        <span className="text-gray-900">Made </span>
        <span className="text-brand-accent relative inline-block">
          Simple
          <span className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-brand-primary to-brand-accent rounded-full" />
        </span>
      </h1>

      <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto px-2">
        Discover, vote, and secure tickets to the hottest events across Monrovia and beyond
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-10 px-4 sm:px-0">
        <Link
          href="/events"
          className="w-full sm:w-auto px-8 py-3.5 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-accent transition-all duration-200 text-center shadow-md hover:shadow-lg active:scale-95 text-sm sm:text-base"
        >
          Browse Events
        </Link>
        <Link
          href="/about"
          className="w-full sm:w-auto px-8 py-3.5 bg-white text-brand-primary font-semibold rounded-xl border-2 border-brand-primary hover:bg-brand-primary hover:text-white transition-all duration-200 text-center active:scale-95 text-sm sm:text-base"
        >
          How It Works
        </Link>
      </div>

      {/* Stats — 2-col on mobile, 4-col on md+ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mb-8">
        <Stat number="500+" label="Events" />
        <Stat number="10k+" label="Tickets Sold" />
        <Stat number="50+" label="Venues" />
        <Stat number="95%" label="Happy Fans" />
      </div>

      {/* Payment Badges */}
      <div className="flex flex-wrap justify-center items-center gap-3 text-xs text-gray-500">
        <Badge color="bg-green-500" text="MTN MoMo" />
        <Badge color="bg-yellow-500" text="Card (Coming Soon)" />
        <Badge color="bg-purple-500" text="SMS Tickets" />
      </div>
    </div>
  );

  return (
    <section className="relative bg-gradient-to-b from-brand-subtle/10 to-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/5 to-brand-accent/5" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20">
        {content}
      </div>
    </section>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center p-3 bg-white/60 rounded-xl border border-white/80 shadow-sm">
      <div className="text-xl md:text-2xl font-bold text-brand-primary">{number}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function Badge({ color, text }: { color: string; text: string }) {
  return (
    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-gray-100 shadow-sm">
      <span className={`w-1.5 h-1.5 ${color} rounded-full`} />
      {text}
    </span>
  );
}