import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Entry from '@/models/Entry'
import Party from '@/models/Party'
import Product from '@/models/Product'
import PaymentMode from '@/models/PaymentMode'
import Client from '@/models/Client'
import User from '@/models/User'
import { requireAuth, isErrorResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if (isErrorResponse(auth)) return auth
  await dbConnect()

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || 'today'
  const customFrom = searchParams.get('from')
  const customTo = searchParams.get('to')
  const clientIdParam = searchParams.get('clientId')

  const clientFilter: any = {}
  if (auth.role !== 'superadmin') {
    clientFilter.clientId = auth.clientId
  } else if (clientIdParam && clientIdParam !== 'all') {
    clientFilter.clientId = clientIdParam
  }

  // Calculate date range
  const now = new Date()
  let startDate: Date, endDate: Date

  if (period === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 1)
  } else if (period === 'week') {
    const day = now.getDay()
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (day === 0 ? 6 : day - 1))
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  } else if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  } else {
    startDate = customFrom ? new Date(customFrom) : new Date(now.getFullYear(), now.getMonth(), now.getDate())
    endDate = customTo ? new Date(customTo + 'T23:59:59') : new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  }

  const entryFilter: any = { ...clientFilter, status: 'active', date: { $gte: startDate, $lt: endDate } }

  const [periodEntries, periodAmountAgg, paymentWise, totalParties, totalProducts, recentEntries] = await Promise.all([
    Entry.countDocuments(entryFilter),
    Entry.aggregate([{ $match: entryFilter }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Entry.aggregate([
      { $match: entryFilter },
      { $lookup: { from: 'cast_payment_modes', localField: 'paymentModeId', foreignField: '_id', as: 'mode' } },
      { $unwind: { path: '$mode', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$mode.name', amount: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { amount: -1 } },
    ]),
    Party.countDocuments({ ...clientFilter, status: 'active' }),
    Product.countDocuments({ ...clientFilter, status: 'active' }),
    Entry.find({ ...clientFilter, status: 'active' })
      .populate('partyId', 'name')
      .populate('productId', 'name')
      .populate('paymentModeId', 'name')
      .sort({ createdAt: -1 })
      .limit(5),
  ])

  return NextResponse.json({
    periodEntries,
    periodAmount: periodAmountAgg[0]?.total || 0,
    todayEntries: periodEntries,
    todayAmount: periodAmountAgg[0]?.total || 0,
    totalParties,
    totalProducts,
    paymentWise: paymentWise.map(p => ({ mode: p._id || 'Unknown', amount: p.amount, count: p.count })),
    recentEntries,
  })
}
