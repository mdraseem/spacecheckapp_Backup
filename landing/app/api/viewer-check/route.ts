import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Public endpoint: Checks if a model is unlocked and can be viewed.
 * Called by viewer.html before loading the 3D model.
 *
 * New model: checks is_unlocked on the generation record.
 * Legacy: also checks hosting_status for existing subscribers.
 *
 * Query params:
 *   - modelUrl: Full URL of the GLB file
 *   - model: Simple path like "brand/file.glb" (fallback)
 *
 * Returns:
 *   { active: true } — model loads normally
 *   { active: false, message: "..." } — show locked/paused UI
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const modelUrl = searchParams.get('modelUrl');
    const modelPath = searchParams.get('model');

    if (!modelUrl && !modelPath) {
      return NextResponse.json({ active: true }); // Graceful fallback — don't block
    }

    // Create Supabase admin client (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Find the generation record by GLB URL
    let query = supabase
      .from('generations')
      .select('id, user_id, is_public, is_unlocked, status')
      .is('deleted_at', null);

    if (modelUrl) {
      query = query.eq('glb_url', modelUrl);
    }

    const { data: generation } = await query.single();

    if (!generation) {
      // Model not found in DB — could be a legacy/external model, allow it
      return NextResponse.json({ active: true });
    }

    // New model: check is_unlocked directly on the generation
    if (generation.is_unlocked === true) {
      return NextResponse.json({ active: true });
    }

    // Legacy fallback: check if model was unlocked via old hosting system (is_public=true)
    // This covers existing subscribers whose models were set to is_public=true before migration
    if (generation.is_public === true) {
      // Double-check: verify the owner still has active hosting (legacy subscribers)
      const { data: profile } = await supabase
        .from('profiles')
        .select('hosting_status, hosting_expires_at')
        .eq('id', generation.user_id)
        .single();

      if (profile) {
        const hostingStatus = profile.hosting_status;
        if (hostingStatus === 'active') {
          return NextResponse.json({ active: true });
        }
        if (hostingStatus === 'trial' && profile.hosting_expires_at) {
          const expiresAt = new Date(profile.hosting_expires_at);
          if (expiresAt > new Date()) {
            return NextResponse.json({ active: true });
          }
        }
      }
    }

    // Model is locked — show paywall message
    return NextResponse.json({
      active: false,
      message: 'This AR experience has not been activated yet. The owner needs to unlock this model to make it publicly available.',
      messagepl: 'To doświadczenie AR nie zostało jeszcze aktywowane. Właściciel musi odblokować ten model, aby był publicznie dostępny.',
    });

  } catch (error: any) {
    console.error('Viewer check error:', error);
    // On error, allow the model to load (fail open to avoid breaking live viewers)
    return NextResponse.json({ active: true });
  }
}
