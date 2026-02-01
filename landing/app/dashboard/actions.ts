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

  