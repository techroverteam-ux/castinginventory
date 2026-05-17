import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Client from '@/models/Client'
import { requireRole, isErrorResponse } from '@/lib/auth'

// GET - List clients (superadmin only)
export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['superadmin'])
  if (isErrorResponse(auth)) return auth

  await dbConnect()

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const search = searchParams.get('search') || ''

  const filter: any = {}
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { contactEmail: { $regex: search, $options: 'i' } },
    ]
  }

  const [clients, total] = await Promise.all([
    Client.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Client.countDocuments(filter),
  ])

  return NextResponse.json({ clients, total, page, limit, totalPages: Math.ceil(total / limit) })
}

// POST - Create client
export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['superadmin'])
  if (isErrorResponse(auth)) return auth

  await dbConnect()

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 })
  }

  const { name, contactEmail, contactPhone, address, logo } = body

  if (!name?.trim()) return NextResponse.json({ message: 'Client name is required' }, { status: 400 })
  if (!contactEmail?.trim()) return NextResponse.json({ message: 'Contact email is required' }, { status: 400 })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return NextResponse.json({ message: 'Invalid email format' }, { status: 400 })

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const existing = await Client.findOne({ slug })
  if (existing) return NextResponse.json({ message: 'Client with similar name already exists' }, { status: 409 })

  const client = await Client.create({
    name: name.trim(),
    slug,
    contactEmail: contactEmail.trim(),
    contactPhone: contactPhone?.trim(),
    address: address?.trim(),
    logo,
    createdBy: auth.userId,
  })

  return NextResponse.json({ message: 'Client created', client }, { status: 201 })
}
