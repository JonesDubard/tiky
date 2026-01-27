// app/(public)/components/Footer.tsx
export default function Footer() {
  return (
    <footer className="mt-20 bg-[#A8CFEA] text-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-12 grid gap-8
        grid-cols-1 md:grid-cols-3">

        {/* Brand */}
        <div>
          <h2 className="text-2xl font-black text-[#F54502]">Tiky</h2>
          <p className="mt-2 text-sm">
            Discover events. Vote in polls. Secure tickets.
          </p>
        </div>

        {/* Partners */}
        <div>
          <h3 className="font-semibold mb-4">Partners</h3>
          <div className="flex gap-4 flex-wrap">
            {["Partner A", "Partner B", "Partner C"].map(p => (
              <div
                key={p}
                className="w-24 h-12 bg-white/70 rounded-lg
                flex items-center justify-center text-xs
                hover:bg-white transition"
              >
                {p}
              </div>
            ))}
          </div>
        </div>

        {/* Links */}
        <div>
          <h3 className="font-semibold mb-4">Explore</h3>
          <ul className="space-y-2 text-sm">
            <li>Events</li>
            <li>Polls</li>
            <li>Login</li>
          </ul>
        </div>

      </div>

      <div className="text-center text-xs py-4 bg-[#1E96C8] text-white">
        © {new Date().getFullYear()} Tiky. All rights reserved.
      </div>
    </footer>
  )
}
