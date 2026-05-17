import { NextRequest, NextResponse } from 'next/server'

const HARDCODED_OTP = '111111'

export async function POST(request: NextRequest) {
  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 })
  }

  const { email, otp } = body
  if (!email) return NextResponse.json({ message: 'Email is required' }, { status: 400 })
  if (!otp) return NextResponse.json({ message: 'OTP is required' }, { status: 400 })

  // Hardcoded OTP verification for now
  if (otp !== HARDCODED_OTP) {
    return NextResponse.json({ message: 'Invalid OTP. Please try again.' }, { status: 400 })
  }

  return NextResponse.json({ message: 'OTP verified successfully', verified: true })
}
