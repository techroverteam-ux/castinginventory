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

  const updateData: any = { updatedBy: auth.userId }

  // Business profile fields (client can update)
  if (body.businessName !== undefined) updateData.businessName = body.businessName?.trim()
  if (body.businessPhone !== undefined) updateData.businessPhone = body.businessPhone?.trim()
  if (body.businessEmail !== undefined) updateData.businessEmail = body.businessEmail?.trim()
  if (body.gstNumber !== undefined) updateData.gstNumber = body.gstNumber?.trim()
  if (body.businessAddress !== undefined) updateData.businessAddress = body.businessAddress?.trim()
  if (body.businessCategory !== undefined) updateData.businessCategory = body.businessCategory
  if (body.businessWebsite !== undefined) updateData.businessWebsite = body.businessWebsite?.trim()
  if (body.enabled !== undefined) updateData.enabled = body.enabled

  // Technical fields (only superadmin can update)
  if (auth.role === 'superadmin') {
    if (body.wabaId !== undefined) updateData.wabaId = body.wabaId?.trim()
    if (body.phoneNumberId !== undefined) updateData.phoneNumberId = body.phoneNumberId?.trim()
    if (body.accessToken !== undefined) updateData.accessToken = body.accessToken?.trim()
    if (body.graphVersion !== undefined) updateData.graphVersion = body.graphVersion?.trim()
    if (body.templateName !== undefined) updateData.templateName = body.templateName?.trim()
    if (body.templateLanguage !== undefined) updateData.templateLanguage = body.templateLanguage
  }

  let config = await WhatsappConfig.findOne({ clientId })
  if (config) {
    Object.assign(config, updateData)
    await config.save()
  } else {
    config = await WhatsappConfig.create({ clientId, ...updateData, createdBy: auth.userId })
  }

  return NextResponse.json({ message: 'Saved', config })
}
