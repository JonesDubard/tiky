import Navbar from "@/components/navigation/Navbar"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      
      <main className="min-h-screen">
        {children}
      </main>
    </>
  )
}
