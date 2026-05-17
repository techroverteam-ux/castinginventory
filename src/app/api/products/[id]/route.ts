import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import { requireRole, isErrorResponse } from '@/lib/auth'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireRole(request, ['superadmin', 'admin', 'manager'])
  if (isErrorResponse(auth)) return auth
  await dbConnect()

  const product = await Product.findById(params.id)
  if (!product) return NextResponse.json({ message: 'Not found' }, { status: 404 })
  if (auth.role !== 'superadmin' && product.clientId.toString() !== auth.clientId) {
    return NextResponse.json({ message: 'Access denied' }, { status: 403 })
  }

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Invalid body' }, { status: 400 })
  }

  const { name, rateSlabs, remarks, status } = body
  if (name?.trim()) product.name = name.trim()
  if (rateSlabs && Array.isArray(rateSlabs)) product.rateSlabs = rateSlabs
  if (remarks !== undefined) product.remarks = remarks?.trim() || ''
  if (status && ['active', 'inactive'].includes(status)) product.status = status
  product.updatedBy = auth.userId
  await product.save()

  return NextResponse.json({ message: 'Updated', product })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireRole(request, ['superadmin', 'admin'])
  if (isErrorResponse(auth)) return auth
  await dbConnect()

  const product = await Product.findById(params.id)
  if (!product) return NextResponse.json({ message: 'Not found' }, { status: 404 })
  if (auth.role !== 'superadmin' && product.clientId.toString() !== auth.clientId) {
    return NextResponse.json({ message: 'Access denied' }, { status: 403 })
  }

  product.status = 'inactive'
  product.updatedBy = auth.userId
  await product.save()
  return NextResponse.json({ message: 'Deleted' })
}
