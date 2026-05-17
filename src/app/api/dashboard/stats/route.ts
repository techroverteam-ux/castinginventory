import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Entry from '@/models/Entry'
import Party from '@/models/Party'
import Product from '@/models/Product'
import { requireAuth, isErrorResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if (isErrorResponse(auth)) return auth
  await dbConnect()

  const clientFilter: any = { status: 'active' }
  if (auth.role !== 'superadmin') clientFilter.clientId = auth.clientId

  const entryFilter: any = { status: 'active' }
  if (auth.role !== 'superadmin') entryFilter.clientId = auth.clientId

  // Today's date range
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayFilter = { ...entryFilter, date: { $gte: today, $lt: tomorrow } }

  const [todayEntries, todayAmountAgg, totalEntries, totalAmountAgg, totalParties, totalProducts, recentEntries] = await Promise.all([
    Entry.countDocuments(todayFilter),
    Entry.aggregate([{ $match: todayFilter }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Entry.countDocuments(entryFilter),
    Entry.aggregate([{ $match: entryFilter }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Party.countDocuments({ ...(auth.role !== 'superadmin' ? { clientId: auth.clientId } : {}), status: 'active' }),
    Product.countDocuments({ ...(auth.role !== 'superadmin' ? { clientId: auth.clientId } : {}), status: 'active' }),
    Entry.find(entryFilter).populate('partyId', 'name').populate('productId', 'name').sort({ createdAt: -1 }).limit(5),
  ])

  return NextResponse.json({
    todayEntries,
    todayAmount: todayAmountAgg[0]?.total || 0,
    totalEntries,
    totalAmount: totalAmountAgg[0]?.total || 0,
    totalParties,
    totalProducts,
    recentEntries,
  })
}
