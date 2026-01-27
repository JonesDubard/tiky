// components/Navbar.tsx
export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🎟️</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Tiky
            </span>
          </div>
          
          {/* Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-gray-600 hover:text-blue-600 font-medium">Features</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 font-medium">Pricing</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 font-medium">Events</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 font-medium">Dashboard</a>
          </div>
          
          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            <button className="hidden md:block text-gray-600 hover:text-blue-600 font-medium">
              Sign In
            </button>
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:opacity-90 transition">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}