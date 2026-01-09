// app/(public)/layout.tsx - SIMPLIFIED (NO PROVIDERS)
import Nav from "./components/Nav"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Nav />
      <main>{children}</main>
    </>
  )
}
