import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { requireRole, isErrorResponse } from '@/lib/auth'

// PATCH - Update user (status, role, name, phone)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireRole(request, ['superadmin', 'admin'])
  if (isErrorResponse(auth)) return auth

  await dbConnect()

  const { id } = params
  const user = await User.findById(id)
  if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })

  // Admin can only manage users in their own client
  if (auth.role === 'admin' && user.clientId?.toString() !== auth.clientId) {
    return NextResponse.json({ message: 'Access denied' }, { status: 403 })
  }

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 })
  }

  const { status, role, name, phone } = body

  if (status && ['active', 'inactive'].includes(status)) user.status = status
  if (role && ['admin', 'manager', 'viewer'].includes(role)) {
    if (role === 'admin' && auth.role !== 'superadmin') {
      return NextResponse.json({ message: 'Only superadmin can assign admin role' }, { status: 403 })
    }
    user.role = role
  }
  if (name?.trim()) user.name = name.trim()
  if (phone !== undefined) user.phone = phone?.trim() ? `+91${phone.trim().replace(/\D/g, '')}` : ''

  await user.save()
  return NextResponse.json({ message: 'User updated', user })
}

// DELETE - Delete user
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireRole(request, ['superadmin', 'admin'])
  if (isErrorResponse(auth)) return auth

  await dbConnect()

  const { id } = params
  const user = await User.findById(id)
  if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })

  // Can't delete yourself
  if (user._id.toString() === auth.userId) {
    return NextResponse.json({ message: 'Cannot delete your own account' }, { status: 400 })
  }

  // Admin can only delete users in their own client
  if (auth.role === 'admin' && user.clientId?.toString() !== auth.clientId) {
    return NextResponse.json({ message: 'Access denied' }, { status: 403 })
  }

  // Can't delete superadmin
  if (user.role === 'superadmin') {
    return NextResponse.json({ message: 'Cannot delete superadmin' }, { status: 403 })
  }

  await User.findByIdAndDelete(id)
  return NextResponse.json({ message: 'User deleted' })
}
