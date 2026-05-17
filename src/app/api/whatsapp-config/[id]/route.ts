import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import WhatsappConfig from '@/models/WhatsappConfig'
import { requireRole, isErrorResponse } from '@/lib/auth'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireRole(request, ['superadmin'])
  if (isErrorResponse(auth)) return auth
  await dbConnect()

  const config = await WhatsappConfig.findById(params.id)
  if (!config) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Invalid body' }, { status: 400 })
  }

  if (body.wabaId !== undefined) config.wabaId = body.wabaId?.trim()
  if (body.phoneNumberId !== undefined) config.phoneNumberId = body.phoneNumberId?.trim()
  if (body.accessToken !== undefined) config.accessToken = body.accessToken?.trim()
  if (body.templateName !== undefined) config.templateName = body.templateName?.trim()
  if (body.templateLanguage !== undefined) config.templateLanguage = body.templateLanguage
  if (body.graphVersion !== undefined) config.graphVersion = body.graphVersion?.trim()
  if (body.enabled !== undefined) config.enabled = body.enabled
  config.updatedBy = auth.userId

  await config.save()
  return NextResponse.json({ message: 'Updated', config })
}
