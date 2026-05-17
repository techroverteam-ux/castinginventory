import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { UserRole } from '@/types'

export interface AuthUser {
  userId: string
  email: string
  role: UserRole
  clientId?: string
}

export function getAuthUser(request: NextRequest): AuthUser | null {
  try {
    const token = request.cookies.get('token')?.value
    if (!token || !process.env.JWT_SECRET) return null
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any
    if (!decoded.userId || !decoded.role) return null
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      clientId: decoded.clientId,
    }
  } catch {
    return null
  }
}

export function requireAuth(request: NextRequest): AuthUser | NextResponse {
  const user = getAuthUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return user
}

export function requireRole(request: NextRequest, allowedRoles: UserRole[]): AuthUser | NextResponse {
  const result = requireAuth(request)
  if (result instanceof NextResponse) return result
  if (!allowedRoles.includes(result.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }
  return result
}

export function isErrorResponse(result: AuthUser | NextResponse): result is NextResponse {
  return result instanceof NextResponse
}
