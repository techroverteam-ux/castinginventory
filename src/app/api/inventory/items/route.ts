import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Item from '@/models/Item'
import { requireRole, isErrorResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['superadmin', 'admin', 'manager', 'viewer'])
  if (isErrorResponse(auth)) return auth

  await dbConnect()

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const status = searchParams.get('status') || ''

  const filter: any = {}
  if (auth.role !== 'superadmin') filter.clientId = auth.clientId
  else if (searchParams.get('clientId')) filter.clientId = searchParams.get('clientId')

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
    ]
  }
  if (category) filter.categoryId = category
  if (status) filter.status = status

  const [items, total] = await Promise.all([
    Item.find(filter).populate('categoryId', 'name').populate('clientId', 'name').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Item.countDocuments(filter),
  ])

  return NextResponse.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) })
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['superadmin', 'admin', 'manager'])
  if (isErrorResponse(auth)) return auth

  await dbConnect()

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 })
  }

  const { name, categoryId, sku, quantity, weight, unit, material, description, clientId } = body

  if (!name?.trim()) return NextResponse.json({ message: 'Item name is required' }, { status: 400 })
  if (!categoryId) return NextResponse.json({ message: 'Category is required' }, { status: 400 })
  if (!sku?.trim()) return NextResponse.json({ message: 'SKU is required' }, { status: 400 })
  if (quantity == null || quantity < 0) return NextResponse.json({ message: 'Valid quantity is required' }, { status: 400 })

  const resolvedClientId = auth.role === 'superadmin' ? clientId : auth.clientId
  if (!resolvedClientId) return NextResponse.json({ message: 'Client is required' }, { status: 400 })

  const existing = await Item.findOne({ sku: sku.trim(), clientId: resolvedClientId })
  if (existing) return NextResponse.json({ message: 'SKU already exists for this client' }, { status: 409 })

  let status: string = 'in_stock'
  if (quantity === 0) status = 'out_of_stock'
  else if (quantity <= 10) status = 'low_stock'

  const item = await Item.create({
    name: name.trim(),
    categoryId,
    clientId: resolvedClientId,
    sku: sku.trim(),
    quantity,
    weight,
    unit: unit?.trim(),
    material: material?.trim(),
    description: description?.trim(),
    status,
    createdBy: auth.userId,
  })

  return NextResponse.json({ message: 'Item created', item }, { status: 201 })
}
