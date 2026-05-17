import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Party from '@/models/Party'
import { requireRole, isErrorResponse } from '@/lib/auth'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireRole(request, ['superadmin', 'admin', 'manager'])
  if (isErrorResponse(auth)) return auth
  await dbConnect()

  const party = await Party.findById(params.id)
  if (!party) return NextResponse.json({ message: 'Not found' }, { status: 404 })
  if (auth.role !== 'superadmin' && party.clientId.toString() !== auth.clientId) {
    return NextResponse.json({ message: 'Access denied' }, { status: 403 })
  }

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Invalid body' }, { status: 400 })
  }

  const { name, accountHead, address, phone, gstin, openingBalance, balanceType } = body
  if (name?.trim()) party.name = name.trim()
  if (accountHead) party.accountHead = accountHead
  if (address !== undefined) party.address = address?.trim() || ''
  if (phone !== undefined) party.phone = phone?.trim() || ''
  if (gstin !== undefined) party.gstin = gstin?.trim() || ''
  if (openingBalance !== undefined) party.openingBalance = openingBalance
  if (balanceType) party.balanceType = balanceType
  party.updatedBy = auth.userId
  await party.save()

  return NextResponse.json({ message: 'Updated', party })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireRole(request, ['superadmin', 'admin'])
  if (isErrorResponse(auth)) return auth
  await dbConnect()

  const party = await Party.findById(params.id)
  if (!party) return NextResponse.json({ message: 'Not found' }, { status: 404 })
  if (auth.role !== 'superadmin' && party.clientId.toString() !== auth.clientId) {
    return NextResponse.json({ message: 'Access denied' }, { status: 403 })
  }

  party.status = 'inactive'
  party.updatedBy = auth.userId
  await party.save()
  return NextResponse.json({ message: 'Deleted' })
}
