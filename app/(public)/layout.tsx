import Navbar from "components/navigation/Navbar";
import Footer from "@/(public)/components/home/Footer";

export default function PublicLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        {children}
      </main>
      <Footer />
    </>
  );
}
