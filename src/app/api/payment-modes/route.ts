import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import PaymentMode from '@/models/PaymentMode'
import { requireRole, isErrorResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['superadmin', 'admin', 'manager', 'viewer'])
  if (isErrorResponse(auth)) return auth
  await dbConnect()

  const { searchParams } = new URL(request.url)
  const clientId = auth.role === 'superadmin' ? (searchParams.get('clientId') || null) : auth.clientId
  if (!clientId) return NextResponse.json({ message: 'Select a client' }, { status: 400 })

  const all = searchParams.get('all') === 'true'
  const filter: any = { clientId }
  if (!all) filter.status = 'active'

  const modes = await PaymentMode.find(filter).populate('createdBy', 'name').sort({ code: 1 })
  return NextResponse.json({ modes })
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['superadmin', 'admin'])
  if (isErrorResponse(auth)) return auth
  await dbConnect()

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Invalid body' }, { status: 400 })
  }

  const { name, clientId: bodyClientId } = body
  const clientId = auth.role === 'superadmin' ? bodyClientId : auth.clientId
  if (!clientId) return NextResponse.json({ message: 'Client required' }, { status: 400 })
  if (!name?.trim()) return NextResponse.json({ message: 'Name required' }, { status: 400 })

  const last = await PaymentMode.findOne({ clientId }).sort({ code: -1 })
  const code = (last?.code || 0) + 1

  const mode = await PaymentMode.create({ code, name: name.trim(), clientId, createdBy: auth.userId })
  return NextResponse.json({ message: 'Created', mode }, { status: 201 })
}
