import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getUserUsage } from '@/utils/usage-limits'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const usage = await getUserUsage(supabase, user.id)

    return NextResponse.json(usage)
  } catch (error: any) {
    console.error('Usage API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch usage' },
      { status: 500 }
    )
  }
}
