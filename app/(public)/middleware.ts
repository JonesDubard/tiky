// app/middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Allow public routes
    if (req.nextUrl.pathname.startsWith('/login') || 
        req.nextUrl.pathname === '/' ||
        req.nextUrl.pathname.startsWith('/events') ||
        req.nextUrl.pathname.startsWith('/polls')) {
      return NextResponse.next()
    }
    
    // Admin routes require ADMIN role
   if (req.nextUrl.pathname.startsWith('/admin')) {
  const token = req.nextauth.token
  if (token?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }
}

    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
  ]
}
