// app/(public)/page.tsx
import FeaturedEvents from "./components/home/FeaturedEvents"
import HeroSection from "./components/home/HeroSection"
import SearchBar from "./components/home/SearchBar"
import CategoryFilters from "./components/home/CategoryFilters"
import Footer from "./components/home/Footer"

async function getEvents() {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/events`, {
    cache: "no-store"
  })

  if (!res.ok) {
    throw new Error("Failed to fetch events")
  }

  return res.json()
}

export default async function HomePage() {
  const events = await getEvents()

  return (
    <>
      <div className="space-y-12 px-4 md:px-8 max-w-7xl mx-auto">
      <HeroSection />
      <SearchBar />
      <CategoryFilters />

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <FeaturedEvents events={events} />
      </div>
      </div>

      <Footer />
    </>
  )
}
