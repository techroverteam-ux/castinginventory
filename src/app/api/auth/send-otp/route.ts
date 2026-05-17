import { NextRequest, NextResponse } from 'next/server'

// For now, this just acknowledges the request.
// In production, integrate with SMS/email OTP provider.
export async function POST(request: NextRequest) {
  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 })
  }

  const { email } = body
  if (!email) return NextResponse.json({ message: 'Email is required' }, { status: 400 })

  // TODO: In production, send actual OTP via email/SMS
  // For now, hardcoded OTP is 111111
  console.log(`[OTP] Sending OTP to ${email} → 111111 (hardcoded)`)

  return NextResponse.json({ message: 'OTP sent successfully' })
}
