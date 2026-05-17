import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Client from '@/models/Client'
import User from '@/models/User'
import { requireRole, isErrorResponse } from '@/lib/auth'

// PATCH - Update client (status toggle, etc.)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireRole(request, ['superadmin'])
  if (isErrorResponse(auth)) return auth

  await dbConnect()

  const { id } = params
  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 })
  }

  const client = await Client.findById(id)
  if (!client) return NextResponse.json({ message: 'Client not found' }, { status: 404 })

  const { status } = body

  if (status && ['active', 'inactive'].includes(status)) {
    client.status = status
    await client.save()

    // Also update all users of this client
    await User.updateMany({ clientId: id }, { status })

    return NextResponse.json({ message: `Client ${status === 'active' ? 'activated' : 'deactivated'}`, client })
  }

  return NextResponse.json({ message: 'No valid fields to update' }, { status: 400 })
}
