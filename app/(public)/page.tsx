import Navbar from '@/components/navigation/Navbar';
import HeroSection from './components/home/HeroSection';
import CategoryFilters from './components/home/CategoryFilters';
import FeaturedEvents from './components/home/FeaturedEvents';
import PollSection from '@/components/polls/PollSection';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <CategoryFilters />
      <PollSection />
      <FeaturedEvents />
    </main>
  );
}
