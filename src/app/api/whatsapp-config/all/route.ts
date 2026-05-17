import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import WhatsappConfig from '@/models/WhatsappConfig'
import Client from '@/models/Client'
import { requireRole, isErrorResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['superadmin'])
  if (isErrorResponse(auth)) return auth
  await dbConnect()

  // Ensure Client model is registered for populate
  Client

  try {
    const configs = await WhatsappConfig.find({}).populate('clientId', 'name contactEmail contactPhone logo').sort({ updatedAt: -1 })
    return NextResponse.json({ configs })
  } catch (error: any) {
    console.error('WhatsApp config all error:', error)
    return NextResponse.json({ configs: [], error: error.message }, { status: 200 })
  }
}
