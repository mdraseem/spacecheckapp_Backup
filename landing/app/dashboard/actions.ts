'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

interface Dimensions {
  width: string
  height: string
  depth: string
}

export async function createGeneration(imagePath: string, dimensions: Dimensions, productName: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Check usage limits
  const { canCreateGeneration } = await import('@/utils/usage-limits')
  const { allowed, usage, error: limitError } = await canCreateGeneration(supabase, user.id)

  if (!allowed) {
    throw new Error(limitError || 'Generation limit exceeded')
  }

  // Construct public URL (assuming public bucket)
  const { data: { publicUrl } } = supabase.storage
    .from('uploads')
    .getPublicUrl(imagePath)

  // Insert into DB with dimensions stored in cm
  const { data: generation, error } = await supabase
    .from('generations')
    .insert({
      user_id: user.id,
      input_image_url: publicUrl,
      status: 'processing',
      name: productName,
      width_cm: parseFloat(dimensions.width),
      height_cm: parseFloat(dimensions.height),
      depth_cm: parseFloat(dimensions.depth)
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Trigger the Modal Backend via Next.js API Route
  // We do this via fetch to our own API to keep the server action clean 
  // and handle the fire-and-forget logic there if needed, 
  // OR strictly we can just fetch the Modal URL here if we had the env var exposed to the server.
  // Using the API route allows us to keep the logic central.
  
  const apiUrl = process.env.NEXT_PUBLIC_SITE_URL 
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/generate`
    : 'http://localhost:3000/api/generate'

  try {
      // We don't await this to avoid blocking the UI redirect, 
      // but in Server Actions, usually we should await. 
      // Since the API route handles the "fire-and-forget" to Modal,
      // this fetch will return quickly (as soon as API route says "queued").
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
      // We still redirect because the record is created, 
      // user will see "Processing" (or we should update to 'failed' if we could catch it)
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

  const { error } = await supabase
    .from('generations')
    .delete()
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
    .single()

  return store
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

  // Check usage limits
  const { canCreateGeneration } = await import('@/utils/usage-limits')
  const { allowed, error: limitError } = await canCreateGeneration(supabase, user.id)

  if (!allowed) {
    throw new Error(limitError || 'Generation limit exceeded')
  }

  // Download image from Shopify and upload to Supabase Storage
  const imageResponse = await fetch(shopifyImageUrl)
  if (!imageResponse.ok) throw new Error('Failed to download product image from Shopify')
  const imageBlob = await imageResponse.blob()
  const fileExt = 'jpg'
  const fileName = `shopify_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('uploads')
    .upload(fileName, imageBlob, {
      contentType: imageBlob.type || 'image/jpeg',
    })

  if (uploadError) throw new Error(uploadError.message)

  const { data: { publicUrl } } = supabase.storage
    .from('uploads')
    .getPublicUrl(fileName)

  // Insert generation record
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

  // Get shop domain
  const { data: store } = await serviceSupabase
    .from('shopify_stores')
    .select('shop_domain')
    .eq('user_id', user.id)
    .single()

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
