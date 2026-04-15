// lib/auth-guard.ts (improved)
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { NextResponse } from "next/server"
import { hasPermission, Permission, Role } from "./permissions"

export async function requirePermission(permission: Permission) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return { 
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null
    }
  }

  const role = session.user.role as Role
  
  if (!hasPermission(role, permission)) {
    return { 
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      session: null
    }
  }

  // Return session on success
  return { error: null, session }
}