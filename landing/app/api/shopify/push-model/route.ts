import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { decryptToken, uploadModelToShopify } from '@/utils/shopify'

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { generationId, shopifyProductId } = body

  if (!generationId || !shopifyProductId) {
    return NextResponse.json(
      { error: 'Missing generationId or shopifyProductId' },
      { status: 400 }
    )
  }

  // Verify user owns the generation
  const { data: generation, error: genError } = await supabase
    .from('generations')
    .select('*')
    .eq('id', generationId)
    .eq('user_id', user.id)
    .single()

  if (genError || !generation) {
    return NextResponse.json(
      { error: 'Generation not found' },
      { status: 404 }
    )
  }

  if (generation.status !== 'completed' || !generation.glb_url) {
    return NextResponse.json(
      { error: 'Generation is not ready yet' },
      { status: 400 }
    )
  }

  // Get connected Shopify store
  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: store, error: storeError } = await serviceSupabase
    .from('shopify_stores')
    .select('*')
    .eq('user_id', user.id)
    .order('installed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (storeError || !store) {
    return NextResponse.json(
      { error: 'No Shopify store connected' },
      { status: 404 }
    )
  }

  try {
    const accessToken = decryptToken(store.access_token_encrypted)
    const modelName = generation.name || `model-${generation.id.slice(0, 8)}`

    // Create sync record
    const { data: syncRecord, error: syncInsertError } = await serviceSupabase
      .from('shopify_syncs')
      .insert({
        generation_id: generationId,
        shop_domain: store.shop_domain,
        shopify_product_id: shopifyProductId,
        sync_status: 'uploading',
      })
      .select()
      .single()

    if (syncInsertError) {
      console.error('Failed to create sync record:', syncInsertError)
    }

    // Upload model to Shopify
    const result = await uploadModelToShopify(
      store.shop_domain,
      accessToken,
      shopifyProductId,
      generation.glb_url,
      modelName
    )

    // Update sync record
    if (syncRecord) {
      await serviceSupabase
        .from('shopify_syncs')
        .update({
          shopify_media_id: result.mediaId,
          sync_status: result.status === 'READY' ? 'completed' : 'processing',
          synced_at: new Date().toISOString(),
        })
        .eq('id', syncRecord.id)
    }

    return NextResponse.json({
      success: true,
      mediaId: result.mediaId,
      status: result.status,
    })
  } catch (error: any) {
    console.error('Failed to push model to Shopify:', error)

    // Update sync record with error if it exists
    if (body.syncId) {
      await serviceSupabase
        .from('shopify_syncs')
        .update({
          sync_status: 'failed',
          error_message: error.message,
        })
        .eq('id', body.syncId)
    }

    return NextResponse.json(
      { error: error.message || 'Failed to upload model to Shopify' },
      { status: 500 }
    )
  }
}
