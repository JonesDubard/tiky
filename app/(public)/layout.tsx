import Navbar from "@/components/navigation/Navbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="pt-16 pb-20 md:pb-0">
        {children}
      </main>
    </>
  );
}

