import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Entry from '@/models/Entry'
import Party from '@/models/Party'
import Product from '@/models/Product'
import { requireRole, isErrorResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['superadmin', 'admin', 'manager', 'viewer'])
  if (isErrorResponse(auth)) return auth
  await dbConnect()

  const { searchParams } = new URL(request.url)
  const clientId = auth.role === 'superadmin' ? searchParams.get('clientId') : auth.clientId
  if (!clientId) return NextResponse.json({ message: 'Client required' }, { status: 400 })

  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const partyId = searchParams.get('partyId')
  const productId = searchParams.get('productId')

  const filter: any = { clientId, status: 'active' }
  if (from || to) {
    filter.date = {}
    if (from) filter.date.$gte = new Date(from)
    if (to) filter.date.$lte = new Date(to + 'T23:59:59')
  }
  if (partyId) filter.partyId = partyId
  if (productId) filter.productId = productId

  const [entries, total] = await Promise.all([
    Entry.find(filter)
      .populate('partyId', 'name code')
      .populate('productId', 'name code')
      .populate('paymentModeId', 'name code')
      .populate('createdBy', 'name')
      .sort({ recNo: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Entry.countDocuments(filter),
  ])

  return NextResponse.json({ entries, total, page, limit, totalPages: Math.ceil(total / limit) })
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['superadmin', 'admin', 'manager'])
  if (isErrorResponse(auth)) return auth
  await dbConnect()

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Invalid body' }, { status: 400 })
  }

  const { date, paymentModeId, partyId, productId, pcs, rate, cashAmount, upiAmount, creditAmount, jobworkerCode, remarks, clientId: bodyClientId } = body
  const clientId = auth.role === 'superadmin' ? bodyClientId : auth.clientId
  if (!clientId) return NextResponse.json({ message: 'Client required' }, { status: 400 })
  if (!partyId) return NextResponse.json({ message: 'Party required' }, { status: 400 })
  if (!productId) return NextResponse.json({ message: 'Product required' }, { status: 400 })
  if (!paymentModeId) return NextResponse.json({ message: 'Payment mode required' }, { status: 400 })
  if (!pcs || pcs < 1) return NextResponse.json({ message: 'PCS must be at least 1' }, { status: 400 })
  if (!rate || rate < 0) return NextResponse.json({ message: 'Rate required' }, { status: 400 })

  // Auto rate from product slabs if not manually set
  const product = await Product.findById(productId)
  if (!product) return NextResponse.json({ message: 'Product not found' }, { status: 404 })

  let finalRate = rate
  if (!rate && product.rateSlabs?.length) {
    const sorted = [...product.rateSlabs].sort((a, b) => b.minQty - a.minQty)
    const slab = sorted.find(s => pcs >= s.minQty)
    finalRate = slab?.rate || product.rateSlabs[0].rate
  }

  const amount = pcs * finalRate
  const cash = cashAmount || 0
  const upi = upiAmount || 0
  const credit = creditAmount || (amount - cash - upi)

  // Auto-generate recNo for this client
  const lastEntry = await Entry.findOne({ clientId }).sort({ recNo: -1 })
  const recNo = (lastEntry?.recNo || 0) + 1

  // Update party balance
  const party = await Party.findById(partyId)
  if (!party) return NextResponse.json({ message: 'Party not found' }, { status: 404 })

  let newBalance = party.currentBalance || 0
  if (credit > 0) {
    if (party.currentBalanceType === 'Dr') newBalance += credit
    else newBalance -= credit
    if (newBalance < 0) {
      newBalance = Math.abs(newBalance)
      party.currentBalanceType = party.currentBalanceType === 'Dr' ? 'Cr' : 'Dr'
    }
  }
  party.currentBalance = newBalance
  await party.save()

  const entry = await Entry.create({
    recNo,
    clientId,
    date: date ? new Date(date) : new Date(),
    paymentModeId,
    partyId,
    productId,
    pcs,
    rate: finalRate,
    amount,
    cashAmount: cash,
    upiAmount: upi,
    creditAmount: credit,
    jobworkerCode: jobworkerCode?.trim(),
    remarks: remarks?.trim(),
    netBalance: party.currentBalance,
    netBalanceType: party.currentBalanceType,
    createdBy: auth.userId,
  })

  return NextResponse.json({
    message: 'Entry saved',
    entry,
    netBalance: party.currentBalance,
    netBalanceType: party.currentBalanceType,
  }, { status: 201 })
}
