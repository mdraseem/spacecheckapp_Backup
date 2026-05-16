'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { uploadToR2, getR2PublicUrl } from '@/utils/r2'

interface Dimensions {
  width: string
  height: string
  depth: string
}

export async function createGeneration(imagePath: string, dimensions: Dimensions, productName: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Generation is free — no credit check or deduction needed

  // Construct public URL from R2
  const publicUrl = getR2PublicUrl(imagePath)

  // Insert into DB with dimensions stored in cm
  // Models are created locked (is_unlocked: false) — user must spend 1 credit to unlock share/download
  const { data: generation, error } = await supabase
    .from('generations')
    .insert({
      user_id: user.id,
      input_image_url: publicUrl,
      status: 'processing',
      name: productName,
      width_cm: parseFloat(dimensions.width),
      height_cm: parseFloat(dimensions.height),
      depth_cm: parseFloat(dimensions.depth),
      is_public: false,
      is_unlocked: false,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Trigger the Modal Backend via Next.js API Route
  const apiUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/generate`
    : 'http://localhost:3000/api/generate'

  try {
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            imageUrl: publicUrl,
            dimensions,
            generationId: generation.id
        })
      })
  } catch (e) {
      console.error("Failed to trigger generation:", e)
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function retryGeneration(generationId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Fetch the existing generation record
  const { data: generation, error: fetchError } = await supabase
    .from('generations')
    .select('*')
    .eq('id', generationId)
    .eq('user_id', user.id) // Ensure user owns this generation
    .single()

  if (fetchError || !generation) {
    throw new Error('Generation not found')
  }

  // Reset status to processing (only update fields that exist)
  try {
    await supabase
      .from('generations')
      .update({
        status: 'processing',
        progress_message: null,
        glb_url: null,
        usdz_url: null
      })
      .eq('id', generationId)
  } catch (updateError: any) {
    // Try without progress_message if column doesn't exist
    await supabase
      .from('generations')
      .update({
        status: 'processing',
        glb_url: null,
        usdz_url: null
      })
      .eq('id', generationId)
  }

  // Use stored dimensions from the database
  const dimensions: Dimensions = {
    width: generation.width_cm?.toString() || '100',
    height: generation.height_cm?.toString() || '100',
    depth: generation.depth_cm?.toString() || '100'
  }

  // Re-trigger the Modal Backend
  const apiUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/generate`
    : 'http://localhost:3000/api/generate'

  try {
    await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: generation.input_image_url,
        dimensions,
        generationId: generation.id
      })
    })
  } catch (e) {
    console.error("Failed to trigger retry:", e)
    throw new Error('Failed to trigger generation retry')
  }

    revalidatePath('/dashboard')

    return { success: true }

  }



export async function deleteGeneration(generationId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Soft-delete: set deleted_at instead of removing the row.
  const { error } = await supabase
    .from('generations')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', generationId)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function disconnectShopify() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Use service role to bypass RLS
  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await serviceSupabase
    .from('shopify_stores')
    .delete()
    .eq('user_id', user.id)

  if (error) {
    throw new Error('Failed to disconnect Shopify store')
  }

  revalidatePath('/dashboard/shopify')
  return { success: true }
}

export async function getShopifyConnection() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: store } = await serviceSupabase
    .from('shopify_stores')
    .select('shop_domain, installed_at')
    .eq('user_id', user.id)
    .order('installed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return store
}

/**
 * Create multiple generations from Shopify product images (bulk operation).
 * Does NOT redirect — returns results so the UI can show progress.
 */
export async function bulkCreateGenerationsFromShopify(
  items: {
    shopifyImageUrl: string
    dimensions: Dimensions
    productName: string
    shopifyProductId: string
  }[]
): Promise<{ results: { productName: string; success: boolean; error?: string }[] }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Generation is free — no credit check needed

  // Get Shopify store info once
  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: store } = await serviceSupabase
    .from('shopify_stores')
    .select('shop_domain')
    .eq('user_id', user.id)
    .order('installed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const apiUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/generate`
    : 'http://localhost:3000/api/generate'

  const results: { productName: string; success: boolean; error?: string }[] = []

  for (const item of items) {
    try {
      // Generation is free — no credit deduction

      // Download image from Shopify and upload to R2
      const imageResponse = await fetch(item.shopifyImageUrl)
      if (!imageResponse.ok) throw new Error('Failed to download image')
      const imageBuffer = Buffer.from(await (await imageResponse.blob()).arrayBuffer())
      const fileName = `shopify_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'

      const publicUrl = await uploadToR2(fileName, imageBuffer, contentType)

      // Insert generation record (locked by default)
      const { data: generation, error: genError } = await supabase
        .from('generations')
        .insert({
          user_id: user.id,
          input_image_url: publicUrl,
          status: 'processing',
          name: item.productName,
          width_cm: parseFloat(item.dimensions.width),
          height_cm: parseFloat(item.dimensions.height),
          depth_cm: parseFloat(item.dimensions.depth),
          is_public: false,
          is_unlocked: false,
        })
        .select()
        .single()

      if (genError) throw new Error(genError.message)

      // Create Shopify sync record
      if (store) {
        await serviceSupabase.from('shopify_syncs').insert({
          generation_id: generation.id,
          shop_domain: store.shop_domain,
          shopify_product_id: item.shopifyProductId,
          sync_status: 'pending',
        })
      }

      // Trigger generation (fire-and-forget)
      fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: publicUrl,
          dimensions: item.dimensions,
          generationId: generation.id,
        }),
      }).catch((e) => console.error('Failed to trigger generation:', e))

      results.push({ productName: item.productName, success: true })
    } catch (e: any) {
      console.error(`Bulk generation failed for ${item.productName}:`, e)
      results.push({ productName: item.productName, success: false, error: e.message })
    }
  }

  revalidatePath('/dashboard')
  return { results }
}

/**
 * Create a generation from a Shopify product image.
 * Similar to createGeneration but downloads the image from Shopify first
 * and records the Shopify product association.
 */
export async function createGenerationFromShopify(
  shopifyImageUrl: string,
  dimensions: Dimensions,
  productName: string,
  shopifyProductId: string
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Generation is free — no credit check or deduction needed

  // Download image from Shopify and upload to R2
  const imageResponse = await fetch(shopifyImageUrl)
  if (!imageResponse.ok) throw new Error('Failed to download product image from Shopify')
  const imageBuffer = Buffer.from(await (await imageResponse.blob()).arrayBuffer())
  const fileName = `shopify_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
  const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'

  const publicUrl = await uploadToR2(fileName, imageBuffer, contentType)

  // Insert generation record (locked by default)
  const { data: generation, error: genError } = await supabase
    .from('generations')
    .insert({
      user_id: user.id,
      input_image_url: publicUrl,
      status: 'processing',
      name: productName,
      width_cm: parseFloat(dimensions.width),
      height_cm: parseFloat(dimensions.height),
      depth_cm: parseFloat(dimensions.depth),
      is_public: false,
      is_unlocked: false,
    })
    .select()
    .single()

  if (genError) throw new Error(genError.message)

  // Create Shopify sync record for later auto-push
  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get shop domain (most recently installed if multiple)
  const { data: store } = await serviceSupabase
    .from('shopify_stores')
    .select('shop_domain')
    .eq('user_id', user.id)
    .order('installed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (store) {
    const { error: syncError } = await serviceSupabase.from('shopify_syncs').insert({
      generation_id: generation.id,
      shop_domain: store.shop_domain,
      shopify_product_id: shopifyProductId,
      sync_status: 'pending',
    })
    if (syncError) {
      console.error('[shopify] Failed to create sync record:', syncError)
    } else {
      console.log(`[shopify] Created sync record: generation=${generation.id} product=${shopifyProductId} shop=${store.shop_domain}`)
    }
  } else {
    console.log('[shopify] No connected store found for user, skipping sync record')
  }

  // Trigger generation
  const apiUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/generate`
    : 'http://localhost:3000/api/generate'

  try {
    await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: publicUrl,
        dimensions,
        generationId: generation.id,
      }),
    })
  } catch (e) {
    console.error('Failed to trigger generation:', e)
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}
