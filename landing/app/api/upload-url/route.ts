import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getPresignedUploadUrl, getR2PublicUrl } from '@/utils/r2'

export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fileName, contentType } = await request.json()

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: 'Missing fileName or contentType' },
        { status: 400 }
      )
    }

    // Generate a unique key to prevent collisions
    const key = `${Math.random().toString(36).slice(2)}_${Date.now()}.${fileName.split('.').pop()}`

    const presignedUrl = await getPresignedUploadUrl(key, contentType, 600) // 10 min expiry
    const publicUrl = getR2PublicUrl(key)

    return NextResponse.json({ presignedUrl, publicUrl, key })
  } catch (error) {
    console.error('Upload URL error:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}
