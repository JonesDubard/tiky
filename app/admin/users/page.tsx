// app/admin/users/page.tsx
//
// CHANGES:
// 1. Selects `status` field (was missing — needed for suspend feature)
// 2. Uses DB groupBy for role stats instead of JS filter on full array
// 3. Adds suspended count to stats
// 4. Passes data to UsersClient (client component) for search/filter/actions
// 5. Removed duplicated mobile/desktop markup — that lives in client now

import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"
import { redirect } from "next/navigation"
import UsersClient from "./components/UsersClient"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect("/login")

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  })

  if (!currentUser || currentUser.role !== "ADMIN") {
    redirect("/unauthorized")
  }

  // ── Single query: role distribution ──────────────────────────────────────
  const roleGroups = await prisma.user.groupBy({
    by: ["role"],
    _count: { _all: true },
  })

  const countByRole: Record<string, number> = {}
  for (const g of roleGroups) countByRole[g.role] = g._count._all

  // Suspended count (cross-role)
  const suspendedCount = await prisma.user.count({
    where: { status: "suspended" },
  })

  const stats = {
    admins: countByRole["ADMIN"] ?? 0,
    organizers: countByRole["ORGANIZER"] ?? 0,
    users: countByRole["USER"] ?? 0,
    suspended: suspendedCount,
    total:
      (countByRole["ADMIN"] ?? 0) +
      (countByRole["ORGANIZER"] ?? 0) +
      (countByRole["USER"] ?? 0),
  }

  // ── Fetch all users ───────────────────────────────────────────────────────
  // Include status so the client can show/toggle suspend state
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,       // ← was missing
      image: true,
      createdAt: true,
      _count: {
        select: {
          orders: true,
        },
      },
    },
  })

  return (
    <UsersClient
      users={users as UserRow[]}
      stats={stats}
      currentUserId={currentUser.id}
    />
  )
}

// ── Shared type (imported by UsersClient) ─────────────────────────────────────
export type UserRow = {
  id: string
  name: string | null
  email: string
  role: string
  status: string
  image: string | null
  createdAt: Date | string
  _count: { orders: number }
}

export type UserStats = {
  admins: number
  organizers: number
  users: number
  suspended: number
  total: number
}