import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { uploadToR2 } from '@/utils/r2'

export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Generate a unique key to prevent collisions
    const ext = file.name.split('.').pop() || 'jpg'
    const key = `${Math.random().toString(36).slice(2)}_${Date.now()}.${ext}`

    // Upload to R2 server-side (avoids CORS issues)
    const buffer = Buffer.from(await file.arrayBuffer())
    const publicUrl = await uploadToR2(key, buffer, file.type || 'image/jpeg')

    return NextResponse.json({ publicUrl, key })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
