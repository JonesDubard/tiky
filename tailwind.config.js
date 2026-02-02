// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontSize: {
        // Fluid typography scales
        'fluid-xs': 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
        'fluid-sm': 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',
        'fluid-base': 'clamp(1rem, 0.925rem + 0.375vw, 1.125rem)',
        'fluid-lg': 'clamp(1.125rem, 1rem + 0.625vw, 1.5rem)',
        'fluid-xl': 'clamp(1.25rem, 1.075rem + 0.875vw, 1.875rem)',
        'fluid-2xl': 'clamp(1.5rem, 1.2rem + 1.5vw, 2.25rem)',
        'fluid-3xl': 'clamp(1.875rem, 1.4rem + 2.375vw, 3rem)',
        'fluid-4xl': 'clamp(2.25rem, 1.6rem + 3.25vw, 3.75rem)',
        'fluid-5xl': 'clamp(3rem, 2rem + 5vw, 4.5rem)',
        'fluid-6xl': 'clamp(3.75rem, 2.5rem + 6.25vw, 5.25rem)',
        'fluid-7xl': 'clamp(4.5rem, 3rem + 7.5vw, 6rem)',
        'fluid-8xl': 'clamp(6rem, 4rem + 10vw, 8rem)',
      },
      colors: {
        brand: {
          accent: '#F54502',    // Vibrant Orange
          primary: '#1E96C8',   // Ocean Blue
          subtle: '#A8CFEA',    // Soft Sky Blue
          // Add these for opacity variants
          'primary/10': 'rgba(30, 150, 200, 0.1)',
          'accent/10': 'rgba(245, 69, 2, 0.1)',
          'subtle/30': 'rgba(168, 207, 234, 0.3)',
        }
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(to right, var(--brand-primary), var(--brand-accent))',
        'gradient-brand-reverse': 'linear-gradient(to right, var(--brand-accent), var(--brand-primary))',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        display: ['Clash Display', 'Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}