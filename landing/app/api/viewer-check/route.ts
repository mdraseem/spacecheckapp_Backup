import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Public endpoint: Checks if a model's hosting is active.
 * Called by viewer.html before loading the 3D model.
 *
 * Query params:
 *   - modelUrl: Full URL of the GLB file
 *   - model: Simple path like "brand/file.glb" (fallback)
 *
 * Returns:
 *   { active: true } — model loads normally
 *   { active: false, message: "..." } — show "Hosting Paused" UI
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
      .select('id, user_id, is_public, status')
      .is('deleted_at', null);

    if (modelUrl) {
      query = query.eq('glb_url', modelUrl);
    }

    const { data: generation } = await query.single();

    if (!generation) {
      // Model not found in DB — could be a legacy/external model, allow it
      return NextResponse.json({ active: true });
    }

    // If model is marked as not public (hosting paused)
    if (!generation.is_public) {
      return NextResponse.json({
        active: false,
        message: 'This AR experience is currently paused. The owner needs to reactivate their hosting subscription.',
        messagepl: 'To doświadczenie AR jest obecnie wstrzymane. Właściciel musi ponownie aktywować subskrypcję hostingu.',
      });
    }

    // Double-check: verify the owner's hosting status
    const { data: profile } = await supabase
      .from('profiles')
      .select('hosting_status, hosting_expires_at')
      .eq('id', generation.user_id)
      .single();

    if (!profile) {
      return NextResponse.json({ active: true }); // No profile = legacy user, allow
    }

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

    // Hosting is paused — update the model to reflect this
    await supabase
      .from('generations')
      .update({ is_public: false, archived_at: new Date().toISOString() })
      .eq('id', generation.id);

    return NextResponse.json({
      active: false,
      message: 'This AR experience is currently paused. The owner needs to reactivate their hosting subscription.',
      messagepl: 'To doświadczenie AR jest obecnie wstrzymane. Właściciel musi ponownie aktywować subskrypcję hostingu.',
    });

  } catch (error: any) {
    console.error('Viewer check error:', error);
    // On error, allow the model to load (fail open to avoid breaking live viewers)
    return NextResponse.json({ active: true });
  }
}
