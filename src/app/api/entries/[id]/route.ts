import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Entry from '@/models/Entry'
import { requireRole, isErrorResponse } from '@/lib/auth'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireRole(request, ['superadmin', 'admin', 'manager'])
  if (isErrorResponse(auth)) return auth
  await dbConnect()

  const entry = await Entry.findById(params.id)
  if (!entry) return NextResponse.json({ message: 'Not found' }, { status: 404 })
  if (auth.role !== 'superadmin' && entry.clientId.toString() !== auth.clientId) {
    return NextResponse.json({ message: 'Access denied' }, { status: 403 })
  }

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Invalid body' }, { status: 400 })
  }

  const { pcs, rate, remarks, jobworkerCode } = body
  if (pcs !== undefined && pcs >= 1) { entry.pcs = pcs; entry.amount = pcs * (rate || entry.rate) }
  if (rate !== undefined && rate >= 0) { entry.rate = rate; entry.amount = (pcs || entry.pcs) * rate }
  if (remarks !== undefined) entry.remarks = remarks?.trim()
  if (jobworkerCode !== undefined) entry.jobworkerCode = jobworkerCode
  entry.updatedBy = auth.userId
  await entry.save()

  return NextResponse.json({ message: 'Updated', entry })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireRole(request, ['superadmin', 'admin'])
  if (isErrorResponse(auth)) return auth
  await dbConnect()

  const entry = await Entry.findById(params.id)
  if (!entry) return NextResponse.json({ message: 'Not found' }, { status: 404 })
  if (auth.role !== 'superadmin' && entry.clientId.toString() !== auth.clientId) {
    return NextResponse.json({ message: 'Access denied' }, { status: 403 })
  }

  entry.status = 'deleted'
  entry.updatedBy = auth.userId
  await entry.save()
  return NextResponse.json({ message: 'Entry deleted' })
}
