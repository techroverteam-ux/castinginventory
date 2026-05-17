import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import Client from '@/models/Client'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ message: 'Server configuration error' }, { status: 500 })
    }

    await dbConnect()

    let body
    try { body = await request.json() } catch {
      return NextResponse.json({ message: 'Invalid request body' }, { status: 400 })
    }

    const { email, password, otp } = body
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const user = await User.findOne({ email: normalizedEmail }).select('+password').populate('clientId', 'name logo slug')

    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 })
    }
    if (user.status === 'inactive') {
      return NextResponse.json({ message: 'Account is deactivated. Contact your administrator.' }, { status: 403 })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 })
    }

    // If OTP not provided, credentials are valid — ask for OTP
    if (!otp) {
      return NextResponse.json({
        message: 'Credentials verified. OTP required.',
        requireOtp: true,
        email: normalizedEmail,
      })
    }

    // Verify OTP (hardcoded 111111 for now)
    if (otp !== '111111') {
      return NextResponse.json({ message: 'Invalid OTP. Please try again.' }, { status: 400 })
    }

    // OTP verified — issue token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, clientId: user.clientId?._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    const response = NextResponse.json({
      message: 'Sign in successful',
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    })

    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('Sign in error:', error)
    return NextResponse.json({ message: 'Authentication failed' }, { status: 500 })
  }
}
