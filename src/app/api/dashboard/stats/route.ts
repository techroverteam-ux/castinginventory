import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Item from '@/models/Item'
import Category from '@/models/Category'
import Client from '@/models/Client'
import User from '@/models/User'
import { requireAuth, isErrorResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if (isErrorResponse(auth)) return auth

  await dbConnect()

  const clientFilter: any = {}
  if (auth.role !== 'superadmin') clientFilter.clientId = auth.clientId

  const [totalItems, totalCategories, totalClients, totalUsers, lowStock, outOfStock] = await Promise.all([
    Item.countDocuments(clientFilter),
    Category.countDocuments({ ...clientFilter, status: 'active' }),
    auth.role === 'superadmin' ? Client.countDocuments({ status: 'active' }) : Promise.resolve(1),
    auth.role === 'superadmin' ? User.countDocuments({ status: 'active' }) : User.countDocuments({ ...clientFilter, status: 'active' }),
    Item.countDocuments({ ...clientFilter, status: 'low_stock' }),
    Item.countDocuments({ ...clientFilter, status: 'out_of_stock' }),
  ])

  return NextResponse.json({
    totalItems,
    totalCategories,
    totalClients,
    totalUsers,
    lowStock,
    outOfStock,
    inStock: totalItems - lowStock - outOfStock,
  })
}
