import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Category from '@/models/Category'
import { requireRole, isErrorResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['superadmin', 'admin', 'manager', 'viewer'])
  if (isErrorResponse(auth)) return auth

  await dbConnect()

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const filter: any = { status: 'active' }
  if (auth.role !== 'superadmin') filter.clientId = auth.clientId
  else if (searchParams.get('clientId')) filter.clientId = searchParams.get('clientId')

  const [categories, total] = await Promise.all([
    Category.find(filter).populate('clientId', 'name').sort({ name: 1 }).skip((page - 1) * limit).limit(limit),
    Category.countDocuments(filter),
  ])

  return NextResponse.json({ categories, total, page, limit })
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['superadmin', 'admin', 'manager'])
  if (isErrorResponse(auth)) return auth

  await dbConnect()

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 })
  }

  const { name, description, clientId } = body
  if (!name?.trim()) return NextResponse.json({ message: 'Category name is required' }, { status: 400 })

  const resolvedClientId = auth.role === 'superadmin' ? clientId : auth.clientId
  if (!resolvedClientId) return NextResponse.json({ message: 'Client is required' }, { status: 400 })

  const existing = await Category.findOne({ name: { $regex: `^${name.trim()}$`, $options: 'i' }, clientId: resolvedClientId })
  if (existing) return NextResponse.json({ message: 'Category already exists' }, { status: 409 })

  const category = await Category.create({
    name: name.trim(),
    description: description?.trim(),
    clientId: resolvedClientId,
    createdBy: auth.userId,
  })

  return NextResponse.json({ message: 'Category created', category }, { status: 201 })
}
