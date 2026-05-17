import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { requireRole, isErrorResponse } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ['superadmin', 'admin'])
  if (isErrorResponse(auth)) return auth

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ message: 'No file provided' }, { status: 400 })

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: 'Only JPEG, PNG, WebP, SVG allowed' }, { status: 400 })
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ message: 'File must be under 5MB' }, { status: 400 })
    }

    const blob = await put(`logos/${Date.now()}-${file.name}`, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return NextResponse.json({ url: blob.url })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ message: 'Upload failed' }, { status: 500 })
  }
}
