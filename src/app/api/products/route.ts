import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import Client from '@/models/Client'
import User from '@/models/User'
import { requireRole, isErrorResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['superadmin', 'admin', 'manager', 'viewer'])
  if (isErrorResponse(auth)) return auth
  await dbConnect()

  const { searchParams } = new URL(request.url)
  const clientId = auth.role === 'superadmin' ? (searchParams.get('clientId') || null) : auth.clientId

  const filter: any = { status: 'active' }
  if (clientId) filter.clientId = clientId

  const products = await Product.find(filter).populate('createdBy', 'name').populate('updatedBy', 'name').populate('clientId', 'name').sort({ code: 1 })
  return NextResponse.json({ products })
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['superadmin', 'admin', 'manager'])
  if (isErrorResponse(auth)) return auth
  await dbConnect()

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Invalid body' }, { status: 400 })
  }

  const { name, rateSlabs, remarks, category, clientId: bodyClientId } = body
  const clientId = auth.role === 'superadmin' ? bodyClientId : auth.clientId
  if (!clientId) return NextResponse.json({ message: 'Client required' }, { status: 400 })
  if (!name?.trim()) return NextResponse.json({ message: 'Product name required' }, { status: 400 })
  if (!rateSlabs || !Array.isArray(rateSlabs) || rateSlabs.length === 0) {
    return NextResponse.json({ message: 'At least one rate slab required' }, { status: 400 })
  }

  // Auto-generate next code for this client
  const lastProduct = await Product.findOne({ clientId }).sort({ code: -1 })
  const code = (lastProduct?.code || 0) + 1

  const product = await Product.create({
    code,
    name: name.trim(),
    category: category || 'gold',
    clientId,
    rateSlabs,
    remarks: remarks?.trim(),
    createdBy: auth.userId,
  })

  return NextResponse.json({ message: 'Product created', product }, { status: 201 })
}
