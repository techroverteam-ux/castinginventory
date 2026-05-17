import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { requireRole, isErrorResponse } from '@/lib/auth'

// GET - List users (superadmin sees all, admin sees own client users)
export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['superadmin', 'admin'])
  if (isErrorResponse(auth)) return auth

  await dbConnect()

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const search = searchParams.get('search') || ''

  const filter: any = {}
  if (auth.role !== 'superadmin') {
    filter.clientId = auth.clientId
  }
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ]
  }

  const [users, total] = await Promise.all([
    User.find(filter).populate('clientId', 'name').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ])

  return NextResponse.json({ users, total, page, limit, totalPages: Math.ceil(total / limit) })
}

// POST - Create user
export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['superadmin', 'admin'])
  if (isErrorResponse(auth)) return auth

  await dbConnect()

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 })
  }

  const { name, email, password, role, clientId, phone } = body

  // Validation
  if (!name?.trim()) return NextResponse.json({ message: 'Name is required' }, { status: 400 })
  if (!email?.trim()) return NextResponse.json({ message: 'Email is required' }, { status: 400 })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ message: 'Invalid email format' }, { status: 400 })
  if (!password || password.length < 6) return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 })
  if (!['superadmin', 'admin', 'manager', 'viewer'].includes(role)) return NextResponse.json({ message: 'Invalid role' }, { status: 400 })

  // Only superadmin can create superadmin/admin roles
  if (['superadmin', 'admin'].includes(role) && auth.role !== 'superadmin') {
    return NextResponse.json({ message: 'Insufficient permissions' }, { status: 403 })
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() })
  if (existing) return NextResponse.json({ message: 'Email already exists' }, { status: 409 })

  const hashedPassword = await bcrypt.hash(password, 12)
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    role,
    clientId: auth.role === 'superadmin' ? clientId : auth.clientId,
    phone: phone?.trim(),
    createdBy: auth.userId,
  })

  return NextResponse.json({ message: 'User created', user: { id: user._id, name: user.name, email: user.email, role: user.role } }, { status: 201 })
}
