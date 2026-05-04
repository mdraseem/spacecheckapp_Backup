import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { deductCredit, canUnlockModel, unlockModel } from '@/utils/usage-limits'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { generationId } = await req.json()
    if (!generationId) {
      return NextResponse.json({ error: 'Missing generationId' }, { status: 400 })
    }

    // Use service role to bypass RLS for the update
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify the user owns this generation
    const { data: generation } = await serviceSupabase
      .from('generations')
      .select('id, user_id, is_unlocked, status, name')
      .eq('id', generationId)
      .eq('user_id', user.id)
      .single()

    if (!generation) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }

    if (generation.is_unlocked) {
      return NextResponse.json({ error: 'Model is already unlocked' }, { status: 400 })
    }

    if (generation.status !== 'completed') {
      return NextResponse.json({ error: 'Model is not ready yet' }, { status: 400 })
    }

    // Check if user has credits (or an active Shopify subscription that
    // bypasses the credit system entirely).
    const { allowed, creditBalance, bypassCredit } = await canUnlockModel(
      serviceSupabase,
      user.id
    )

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'No credits remaining. Purchase credits to unlock this model.',
          code: 'NO_CREDITS',
          creditBalance,
        },
        { status: 402 }
      )
    }

    // Deduct 1 credit only for direct (Stripe) users. Shopify-billed
    // subscribers consume nothing — their plan covers usage.
    const newBalance = bypassCredit
      ? creditBalance
      : await deductCredit(serviceSupabase, user.id)

    // Unlock the model
    await unlockModel(serviceSupabase, generationId)

    // Track analytics
    await serviceSupabase
      .from('analytics')
      .insert({
        event_type: 'model_unlocked',
        user_id: user.id,
        metadata: {
          generation_id: generationId,
          model_name: generation.name,
          credit_balance_after: newBalance,
          billing_source: bypassCredit ? 'shopify' : 'stripe',
          bypass_credit: !!bypassCredit,
        },
      })

    console.log(
      `Model unlocked: ${generationId} for user ${user.id} ` +
      `(${bypassCredit ? 'shopify-subscription' : `credit, balance: ${newBalance}`})`
    )

    return NextResponse.json({
      success: true,
      newCreditBalance: newBalance,
      bypassCredit: !!bypassCredit,
    })
  } catch (error: any) {
    console.error('Unlock model error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to unlock model' },
      { status: 500 }
    )
  }
}
