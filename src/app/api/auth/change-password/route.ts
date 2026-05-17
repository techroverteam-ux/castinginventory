import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { requireAuth, isErrorResponse } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const auth = requireAuth(request)
  if (isErrorResponse(auth)) return auth

  await dbConnect()

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 })
  }

  const { newPassword, confirmPassword } = body

  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 })
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ message: 'Passwords do not match' }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12)

  await User.findByIdAndUpdate(auth.userId, {
    password: hashedPassword,
    mustChangePassword: false,
  })

  return NextResponse.json({ message: 'Password changed successfully' })
}
