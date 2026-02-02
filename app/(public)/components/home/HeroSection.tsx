// app/components/home/HeroSection.tsx - UPDATED (Filters Removed)
'use client';
import { useEffect, useRef, useState } from 'react';
import { Users, Ticket, Calendar, Star } from 'lucide-react';

export default function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [animatedStats, setAnimatedStats] = useState({
    events: 0,
    tickets: 0,
    satisfaction: 0
  });

  useEffect(() => {
    if (heroRef.current) {
      heroRef.current.style.opacity = '1';
      heroRef.current.style.transform = 'translateY(0)';
    }

    // Animate stats count-up
    const animateStats = () => {
      const duration = 2000; // 2 seconds
      const steps = 60;
      const interval = duration / steps;
      
      let step = 0;
      const timer = setInterval(() => {
        step++;
        const progress = step / steps;
        
        // Easing function for smooth animation
        const easeOutQuad = (t: number) => t * (2 - t);
        
        setAnimatedStats({
          events: Math.floor(easeOutQuad(progress) * 500),
          tickets: Math.floor(easeOutQuad(progress) * 10000),
          satisfaction: Math.floor(easeOutQuad(progress) * 95)
        });

        if (step >= steps) {
          clearInterval(timer);
          // Set final values
          setAnimatedStats({
            events: 500,
            tickets: 10000,
            satisfaction: 95
          });
        }
      }, interval);
    };

    // Start animation after a short delay
    const timeout = setTimeout(animateStats, 300);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <section className="px-6 pt-16 pb-8 md:pt-24 md:pb-12 relative overflow-hidden bg-gradient-to-b from-brand-subtle/20 via-white to-white">
      {/* Background Elements */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-brand-primary/10 to-brand-accent/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-brand-accent/5 to-brand-primary/10 rounded-full blur-3xl" />
      
      <div
        ref={heroRef}
        className="relative opacity-0 transform translate-y-8 transition-all duration-700 ease-out text-center max-w-6xl mx-auto"
      >
        {/* Main Headline */}
        <h1 className="text-fluid-5xl md:text-fluid-7xl lg:text-fluid-8xl font-black mb-6 leading-tight">
          <span className="text-slate-900">Events in </span>
          <span className="text-brand-primary">Liberia</span>
          <br />
          <span className="text-slate-900">Made </span>
          <span className="relative">
          <span className="text-brand-accent">Simple</span>
          <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-brand-primary to-brand-accent rounded-full" />
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto font-light">
          Discover, vote, and secure tickets to the hottest events across Monrovia and beyond
        </p>

        {/* Animated Stats */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 mb-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="w-6 h-6 text-brand-primary" />
              <div className="text-3xl md:text-4xl font-bold text-brand-primary">
                {animatedStats.events.toLocaleString()}+
              </div>
            </div>
            <div className="text-slate-600 text-sm">Events Listed</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Ticket className="w-6 h-6 text-brand-accent" />
              <div className="text-3xl md:text-4xl font-bold text-brand-accent">
                {animatedStats.tickets.toLocaleString()}+
              </div>
            </div>
            <div className="text-slate-600 text-sm">Tickets Sold</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="w-6 h-6 text-brand-primary" />
              <div className="text-3xl md:text-4xl font-bold text-brand-primary">
                {animatedStats.satisfaction}%
              </div>
            </div>
            <div className="text-slate-600 text-sm">Satisfaction Rate</div>
          </div>
        </div>
      </div>
    </section>
  );
}