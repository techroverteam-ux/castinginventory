import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import dbConnect from '@/lib/mongodb'
import Client from '@/models/Client'
import User from '@/models/User'
import { requireRole, isErrorResponse } from '@/lib/auth'

function generatePassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

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

// POST - Create client + auto-create admin user with random password
export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['superadmin'])
  if (isErrorResponse(auth)) return auth

  await dbConnect()

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 })
  }

  const { name, contactEmail, contactPhone, address, logo, favicon } = body

  if (!name?.trim()) return NextResponse.json({ message: 'Client name is required' }, { status: 400 })
  if (!contactEmail?.trim()) return NextResponse.json({ message: 'Contact email is required' }, { status: 400 })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return NextResponse.json({ message: 'Invalid email format' }, { status: 400 })

  // Phone validation (Indian 10-digit)
  if (contactPhone?.trim()) {
    const digits = contactPhone.trim().replace(/\D/g, '')
    if (digits.length !== 10) {
      return NextResponse.json({ message: 'Phone number must be exactly 10 digits' }, { status: 400 })
    }
    if (!/^[6-9]/.test(digits)) {
      return NextResponse.json({ message: 'Phone must start with 6, 7, 8, or 9' }, { status: 400 })
    }
  }

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const existing = await Client.findOne({ slug })
  if (existing) return NextResponse.json({ message: 'Client with similar name already exists' }, { status: 409 })

  // Check if email already used
  const existingUser = await User.findOne({ email: contactEmail.toLowerCase().trim() })
  if (existingUser) return NextResponse.json({ message: 'Email already registered as a user' }, { status: 409 })

  // Create client
  const client = await Client.create({
    name: name.trim(),
    slug,
    contactEmail: contactEmail.trim().toLowerCase(),
    contactPhone: contactPhone?.trim() ? `+91${contactPhone.trim().replace(/\D/g, '')}` : undefined,
    address: address?.trim(),
    logo,
    favicon,
    createdBy: auth.userId,
  })

  // Generate random password and create admin user for this client
  const randomPassword = generatePassword(10)
  const hashedPassword = await bcrypt.hash(randomPassword, 12)

  await User.create({
    name: name.trim(),
    email: contactEmail.trim().toLowerCase(),
    password: hashedPassword,
    role: 'admin',
    clientId: client._id,
    status: 'active',
    mustChangePassword: true,
    createdBy: auth.userId,
  })

  return NextResponse.json({
    message: 'Client created successfully',
    client,
    credentials: {
      email: contactEmail.trim().toLowerCase(),
      password: randomPassword,
      note: 'Client must change password on first login',
    }
  }, { status: 201 })
}
