'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

export default function AdminDashboard() {
  const { data: session, status } = useSession()

  if (status === 'loading') return <p>Loading...</p>

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Admin Dashboard</h2>
      <p>Welcome, {session.user.email}</p>
    </div>
  )
}
