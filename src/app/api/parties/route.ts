import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Party from '@/models/Party'
import Client from '@/models/Client'
import { requireRole, isErrorResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['superadmin', 'admin', 'manager', 'viewer'])
  if (isErrorResponse(auth)) return auth
  await dbConnect()

  const { searchParams } = new URL(request.url)
  const clientId = auth.role === 'superadmin' ? (searchParams.get('clientId') || null) : auth.clientId

  const search = searchParams.get('search') || ''
  const accountHead = searchParams.get('accountHead') || ''

  const filter: any = { status: 'active' }
  if (clientId) filter.clientId = clientId
  if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { code: { $regex: search, $options: 'i' } }]
  if (accountHead) filter.accountHead = accountHead

  const parties = await Party.find(filter).populate('clientId', 'name').sort({ code: 1 })
  return NextResponse.json({ parties })
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['superadmin', 'admin', 'manager'])
  if (isErrorResponse(auth)) return auth
  await dbConnect()

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Invalid body' }, { status: 400 })
  }

  const { name, accountHead, address, phone, gstin, openingBalance, balanceType, clientId: bodyClientId } = body
  const clientId = auth.role === 'superadmin' ? bodyClientId : auth.clientId
  if (!clientId) return NextResponse.json({ message: 'Client required' }, { status: 400 })
  if (!name?.trim()) return NextResponse.json({ message: 'Party name required' }, { status: 400 })

  // Auto-generate code
  const lastParty = await Party.findOne({ clientId }).sort({ code: -1 })
  const nextCode = String((parseInt(lastParty?.code || '0') || 0) + 1)

  const party = await Party.create({
    code: nextCode,
    name: name.trim(),
    clientId,
    accountHead: accountHead || 'sundry_debtors',
    address: address?.trim(),
    phone: phone?.trim(),
    gstin: gstin?.trim(),
    openingBalance: openingBalance || 0,
    balanceType: balanceType || 'Dr',
    currentBalance: openingBalance || 0,
    currentBalanceType: balanceType || 'Dr',
    createdBy: auth.userId,
  })

  return NextResponse.json({ message: 'Party created', party }, { status: 201 })
}
