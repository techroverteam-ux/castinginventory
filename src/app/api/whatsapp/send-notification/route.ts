import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { requireRole, isErrorResponse } from '@/lib/auth'
import { sendWhatsAppText } from '@/lib/whatsapp'

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['superadmin', 'admin', 'manager'])
  if (isErrorResponse(auth)) return auth
  await dbConnect()

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Invalid body' }, { status: 400 })
  }

  const { clientId, phone, message } = body
  const resolvedClientId = auth.role === 'superadmin' ? clientId : auth.clientId

  if (!resolvedClientId) return NextResponse.json({ message: 'Client required' }, { status: 400 })
  if (!phone) return NextResponse.json({ message: 'Phone required' }, { status: 400 })
  if (!message) return NextResponse.json({ message: 'Message required' }, { status: 400 })

  const result = await sendWhatsAppText({ clientId: resolvedClientId, phone, message })

  if (result.success) {
    return NextResponse.json({ success: true, messageId: result.messageId })
  } else {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }
}
