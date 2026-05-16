import { NextResponse } from 'next/server'

/**
 * POST /api/shopify/auto-sync
 *
 * Called by the Modal backend after a generation completes.
 * Checks if there's a pending Shopify sync record and uploads the 3D model
 * to the associated Shopify product — fully server-side, no browser needed.
 *
 * Body: { generationId: string }
 * Auth: Validated via MODAL_WEBHOOK_SECRET header
 */
export async function POST(request: Request) {
  try {
    // Validate the request comes from our Modal backend
    const webhookSecret = process.env.MODAL_WEBHOOK_SECRET
    const authHeader = request.headers.get('x-webhook-secret')

    if (webhookSecret && authHeader !== webhookSecret) {
      console.error('[shopify-auto-sync] Invalid webhook secret')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { generationId } = body

    if (!generationId) {
      return NextResponse.json({ error: 'Missing generationId' }, { status: 400 })
    }

    console.log(`[shopify-auto-sync] Received callback for generation ${generationId}`)

    // Use service role client to bypass RLS
    const { createClient } = await import('@supabase/supabase-js')
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check for a pending sync record
    const { data: syncRecord, error: syncError } = await serviceSupabase
      .from('shopify_syncs')
      .select('*')
      .eq('generation_id', generationId)
      .eq('sync_status', 'pending')
      .single()

    if (syncError || !syncRecord) {
      console.log(`[shopify-auto-sync] No pending sync for generation ${generationId}`)
      return NextResponse.json({ status: 'no_sync_needed' })
    }

    console.log(`[shopify-auto-sync] Found pending sync → product ${syncRecord.shopify_product_id} @ ${syncRecord.shop_domain}`)

    // Get the generation data
    const { data: generation } = await serviceSupabase
      .from('generations')
      .select('*')
      .eq('id', generationId)
      .single()

    if (!generation?.glb_url) {
      console.log(`[shopify-auto-sync] Generation ${generationId} has no GLB URL yet`)
      return NextResponse.json({ status: 'no_glb_url' })
    }

    // Get the Shopify store credentials (most recent install for this shop)
    const { data: store } = await serviceSupabase
      .from('shopify_stores')
      .select('*')
      .eq('shop_domain', syncRecord.shop_domain)
      .order('installed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!store) {
      console.log(`[shopify-auto-sync] No store found for ${syncRecord.shop_domain}`)
      return NextResponse.json({ status: 'no_store' })
    }

    // Update sync status to uploading
    await serviceSupabase
      .from('shopify_syncs')
      .update({ sync_status: 'uploading' })
      .eq('id', syncRecord.id)

    try {
      const { decryptToken, uploadModelToShopify } = await import('@/utils/shopify')
      const accessToken = decryptToken(store.access_token_encrypted)
      const modelName = generation.name || `model-${generation.id.slice(0, 8)}`

      const result = await uploadModelToShopify(
        store.shop_domain,
        accessToken,
        syncRecord.shopify_product_id,
        generation.glb_url,
        modelName
      )

      await serviceSupabase
        .from('shopify_syncs')
        .update({
          shopify_media_id: result.mediaId,
          sync_status: result.status === 'READY' ? 'completed' : 'processing',
          synced_at: new Date().toISOString(),
        })
        .eq('id', syncRecord.id)

      console.log(`[shopify-auto-sync] Successfully synced generation ${generationId} to Shopify product ${syncRecord.shopify_product_id}`)
      return NextResponse.json({ status: 'synced', mediaId: result.mediaId })
    } catch (uploadErr: any) {
      console.error(`[shopify-auto-sync] Upload failed for ${generationId}:`, uploadErr)
      await serviceSupabase
        .from('shopify_syncs')
        .update({
          sync_status: 'failed',
          error_message: uploadErr.message,
        })
        .eq('id', syncRecord.id)

      return NextResponse.json({ status: 'failed', error: uploadErr.message }, { status: 500 })
    }
  } catch (error: any) {
    console.error('[shopify-auto-sync] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
