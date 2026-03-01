import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Fetch the generation status from the database
    const { data: generation, error } = await supabase
      .from('generations')
      .select('id, status, progress_message, glb_url, usdz_url, created_at')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching generation:', error)
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(generation)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
