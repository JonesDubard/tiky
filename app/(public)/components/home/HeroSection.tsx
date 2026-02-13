// // app/(public)/components/home/HeroSection.tsx
// 'use client';

// import { useEffect, useRef, useState } from 'react';
// import Link from 'next/link';

// export default function HeroSection() {
//   const heroRef = useRef<HTMLDivElement>(null);
//   const [mounted, setMounted] = useState(false);

//   useEffect(() => {
//     setMounted(true);
    
//     // Optional: Add fade-in effect after mount
//     if (heroRef.current) {
//       heroRef.current.style.opacity = '1';
//     }
//   }, []);

//   return (
//     <section className="relative bg-gradient-to-b from-brand-subtle/10 to-white overflow-hidden">
//       {/* Simplified background - single subtle gradient (less CPU intensive) */}
//       <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/5 to-brand-accent/5" />
      
//       <div
//         ref={heroRef}
//         // Remove the conditional opacity class that causes hydration mismatch
//         className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 transition-opacity duration-700 opacity-100"
//       >
//         {/* Main content - centered for Liberia mobile-first */}
//         <div className="text-center max-w-4xl mx-auto">
//           {/* Main Headline - Simplified, bold, and clear */}
//           <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 leading-tight">
//             <span className="text-gray-900">Events in </span>
//             <span className="text-brand-primary">Liberia</span>
//             <br />
//             <span className="text-gray-900">Made </span>
//             <span className="text-brand-accent relative">
//               Simple
//               <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-brand-primary to-brand-accent rounded-full" />
//             </span>
//           </h1>

//           {/* Subtitle - Clear value proposition */}
//           <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
//             Discover, vote, and secure tickets to the hottest events across Monrovia and beyond
//           </p>

//           {/* CTA Buttons - Prominent and mobile-friendly */}
//           <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
//             <Link
//               href="/events"
//               className="w-full sm:w-auto px-8 py-4 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-accent transition-all duration-200 text-center shadow-lg hover:shadow-xl active:scale-95"
//             >
//               Browse Events
//             </Link>
//             <Link
//               href="/about"
//               className="w-full sm:w-auto px-8 py-4 bg-white text-brand-primary font-semibold rounded-xl border-2 border-brand-primary hover:bg-brand-primary hover:text-white transition-all duration-200 text-center"
//             >
//               How It Works
//             </Link>
//           </div>

//           {/* Stats - Simplified for Liberia context */}
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
//             <div className="text-center p-3">
//               <div className="text-2xl md:text-3xl font-bold text-brand-primary">500+</div>
//               <div className="text-xs md:text-sm text-gray-600">Events</div>
//             </div>
//             <div className="text-center p-3">
//               <div className="text-2xl md:text-3xl font-bold text-brand-accent">10k+</div>
//               <div className="text-xs md:text-sm text-gray-600">Tickets Sold</div>
//             </div>
//             <div className="text-center p-3">
//               <div className="text-2xl md:text-3xl font-bold text-brand-primary">50+</div>
//               <div className="text-xs md:text-sm text-gray-600">Venues</div>
//             </div>
//             <div className="text-center p-3">
//               <div className="text-2xl md:text-3xl font-bold text-brand-accent">95%</div>
//               <div className="text-xs md:text-sm text-gray-600">Happy Fans</div>
//             </div>
//           </div>

//           {/* Liberia-specific payment badges - FIXED duplicate yellow badges */}
//           <div className="mt-8 flex flex-wrap justify-center items-center gap-4 text-xs text-gray-500">
//             <PaymentBadge color="bg-green-500" text="MTN MoMo" />
//             <PaymentBadge color="bg-blue-500" text="Card Payment" />
//             <PaymentBadge color="bg-purple-500" text="SMS Tickets" />
//             <PaymentBadge color="bg-orange-500" text="Orange Money (Coming Soon)" />
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

// // Extract PaymentBadge to ensure consistency
// function PaymentBadge({ color, text }: { color: string; text: string }) {
//   return (
//     <span className="flex items-center">
//       <span className={`w-1.5 h-1.5 ${color} rounded-full mr-1.5`} />
//       {text}
//     </span>
//   );
// }

// app/(public)/components/home/HeroSection.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return null on first render to match server
  if (!mounted) {
    return (
      <section className="relative bg-gradient-to-b from-brand-subtle/10 to-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/5 to-brand-accent/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Simple skeleton that matches client structure */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 leading-tight">
              <span className="text-gray-900">Events in </span>
              <span className="text-brand-primary">Liberia</span>
              <br />
              <span className="text-gray-900">Made </span>
              <span className="text-brand-accent relative">
                Simple
                <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-brand-primary to-brand-accent rounded-full" />
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Discover, vote, and secure tickets to the hottest events across Monrovia and beyond
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-gradient-to-b from-brand-subtle/10 to-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/5 to-brand-accent/5" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 leading-tight">
            <span className="text-gray-900">Events in </span>
            <span className="text-brand-primary">Liberia</span>
            <br />
            <span className="text-gray-900">Made </span>
            <span className="text-brand-accent relative">
              Simple
              <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-brand-primary to-brand-accent rounded-full" />
            </span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Discover, vote, and secure tickets to the hottest events across Monrovia and beyond
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link
              href="/events"
              className="w-full sm:w-auto px-8 py-4 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-accent transition-all duration-200 text-center shadow-lg hover:shadow-xl active:scale-95"
            >
              Browse Events
            </Link>
            <Link
              href="/about"
              className="w-full sm:w-auto px-8 py-4 bg-white text-brand-primary font-semibold rounded-xl border-2 border-brand-primary hover:bg-brand-primary hover:text-white transition-all duration-200 text-center"
            >
              How It Works
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <Stat number="500+" label="Events" />
            <Stat number="10k+" label="Tickets Sold" />
            <Stat number="50+" label="Venues" />
            <Stat number="95%" label="Happy Fans" />
          </div>

          {/* Payment Badges */}
          <div className="mt-8 flex flex-wrap justify-center items-center gap-4 text-xs text-gray-500">
            <Badge color="bg-green-500" text="MTN MoMo" />
            <Badge color="bg-yellow-500" text="Card (Coming Soon)" />
            <Badge color="bg-purple-500" text="SMS Tickets" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center p-3">
      <div className="text-2xl md:text-3xl font-bold text-brand-primary">{number}</div>
      <div className="text-xs md:text-sm text-gray-600">{label}</div>
    </div>
  );
}

function Badge({ color, text }: { color: string; text: string }) {
  return (
    <span className="flex items-center">
      <span className={`w-1.5 h-1.5 ${color} rounded-full mr-1.5`} />
      {text}
    </span>
  );
}