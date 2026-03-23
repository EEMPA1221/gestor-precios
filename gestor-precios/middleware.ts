import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuth = !!req.auth

  // Public routes
  if (pathname.startsWith('/login')) {
    if (isAuth) return NextResponse.redirect(new URL('/dashboard', req.url))
    return NextResponse.next()
  }

  // Protected routes
  if (!isAuth) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Admin-only routes
  const adminOnly = ['/usuarios', '/configuracion']
  const role = (req.auth?.user as any)?.role
  if (adminOnly.some(p => pathname.startsWith(p)) && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
