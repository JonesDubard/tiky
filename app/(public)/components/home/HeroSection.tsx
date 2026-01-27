// app/components/home/HeroSection.tsx
'use client';
import { useEffect, useRef } from 'react';
import SearchBar from './SearchBar'; // We'll update this next

export default function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (heroRef.current) {
      heroRef.current.style.opacity = '1';
      heroRef.current.style.transform = 'translateY(0)';
    }
  }, []);

  return (
    <section className="px-6 pt-12 pb-10 relative overflow-hidden">
  {/* Soft background glow */}
  <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#FF6B35]/10 rounded-full blur-3xl" />

  <div
    ref={heroRef}
    className="relative opacity-0 transform translate-y-4 transition-all duration-700 ease-out"
  >
        {/* Single-line headline as per your screenshot */}
        <h1 className="text-4xl md:text-5xl font-black text-center mb-3">
          Events in Liberia,{' '}
          <span className="text-[#FF6B35]">Made Simple</span>
        </h1>
      </div>
    </section>
  );
}