import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import WhatsappConfig from '@/models/WhatsappConfig'
import { requireRole, isErrorResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['superadmin', 'admin'])
  if (isErrorResponse(auth)) return auth
  await dbConnect()

  const clientId = auth.clientId
  if (!clientId && auth.role !== 'superadmin') return NextResponse.json({ config: null })

  const config = await WhatsappConfig.findOne({ clientId })
  return NextResponse.json({ config: config || null })
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['superadmin', 'admin'])
  if (isErrorResponse(auth)) return auth
  await dbConnect()

  const clientId = auth.clientId
  if (!clientId) return NextResponse.json({ message: 'Client required' }, { status: 400 })

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Invalid body' }, { status: 400 })
  }

  const { enabled, wabaId, phoneNumberId, accessToken, graphVersion, templateName, templateLanguage, businessName } = body

  let config = await WhatsappConfig.findOne({ clientId })
  if (config) {
    config.enabled = enabled
    config.wabaId = wabaId?.trim()
    config.phoneNumberId = phoneNumberId?.trim()
    config.accessToken = accessToken?.trim()
    config.graphVersion = graphVersion?.trim() || 'v25.0'
    config.templateName = templateName?.trim()
    config.templateLanguage = templateLanguage || 'en'
    config.businessName = businessName?.trim()
    config.updatedBy = auth.userId
    await config.save()
  } else {
    config = await WhatsappConfig.create({
      clientId,
      enabled,
      wabaId: wabaId?.trim(),
      phoneNumberId: phoneNumberId?.trim(),
      accessToken: accessToken?.trim(),
      graphVersion: graphVersion?.trim() || 'v25.0',
      templateName: templateName?.trim(),
      templateLanguage: templateLanguage || 'en',
      businessName: businessName?.trim(),
      createdBy: auth.userId,
    })
  }

  return NextResponse.json({ message: 'Saved', config })
}
