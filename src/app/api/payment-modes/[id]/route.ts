import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import PaymentMode from '@/models/PaymentMode'
import { requireRole, isErrorResponse } from '@/lib/auth'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireRole(request, ['superadmin', 'admin'])
  if (isErrorResponse(auth)) return auth
  await dbConnect()

  const mode = await PaymentMode.findById(params.id)
  if (!mode) return NextResponse.json({ message: 'Not found' }, { status: 404 })
  if (auth.role !== 'superadmin' && mode.clientId.toString() !== auth.clientId) {
    return NextResponse.json({ message: 'Access denied' }, { status: 403 })
  }

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Invalid body' }, { status: 400 })
  }

  if (body.status && ['active', 'inactive'].includes(body.status)) mode.status = body.status
  await mode.save()
  return NextResponse.json({ message: 'Updated', mode })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireRole(request, ['superadmin', 'admin'])
  if (isErrorResponse(auth)) return auth
  await dbConnect()

  const mode = await PaymentMode.findById(params.id)
  if (!mode) return NextResponse.json({ message: 'Not found' }, { status: 404 })
  if (auth.role !== 'superadmin' && mode.clientId.toString() !== auth.clientId) {
    return NextResponse.json({ message: 'Access denied' }, { status: 403 })
  }

  await PaymentMode.findByIdAndDelete(params.id)
  return NextResponse.json({ message: 'Deleted' })
}
