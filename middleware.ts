import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const publicPaths = ['/auth/signin', '/auth/signup', '/api/auth/signin', '/api/auth/signup']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow static files
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next()
  }

  const token = request.cookies.get('token')?.value
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    await jwtVerify(token, secret)
    return NextResponse.next()
  } catch {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 })
    }
    const response = NextResponse.redirect(new URL('/auth/signin', request.url))
    response.cookies.set({ name: 'token', value: '', maxAge: 0, path: '/' })
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
