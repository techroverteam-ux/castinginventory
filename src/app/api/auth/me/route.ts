import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { requireAuth, isErrorResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if (isErrorResponse(auth)) return auth

  await dbConnect()
  const user = await User.findById(auth.userId).populate('clientId', 'name logo slug')
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  return NextResponse.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      clientId: user.clientId?._id,
      clientName: user.clientId?.name,
      clientLogo: user.clientId?.logo,
      mustChangePassword: user.mustChangePassword || false,
    }
  })
}
