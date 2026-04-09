import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token

    // For API routes — return JSON 401 instead of redirecting to login page
    if (req.nextUrl.pathname.startsWith("/api/")) {
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      return NextResponse.next()
    }

    // For admin pages — redirect to login if not authenticated
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // Block non-admins from admin pages
    if (
      req.nextUrl.pathname.startsWith("/admin") &&
      token.role !== "ADMIN" &&
      token.role !== "ORGANIZER"
    ) {
      return NextResponse.redirect(new URL("/", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      // Always run middleware function — handle auth logic inside
      authorized: () => true,
    },
  }
)

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}