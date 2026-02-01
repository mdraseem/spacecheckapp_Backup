import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitResponse } from '@/utils/rate-limit';

export async function POST(req: NextRequest) {
  // Rate limit: 100 analytics events per minute (generous for AR tracking)
  const rateLimitResult = await rateLimit(req, {
    maxRequests: 100,
    windowMs: 60 * 1000 // 1 minute
  });

  if (!rateLimitResult.success) {
    return rateLimitResponse('Too many analytics events.', rateLimitResult);
  }

  try {
    const body = await req.json();

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Missing Supabase configuration');
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    // Extract event data from the payload
    const {
      event: eventType,
      user_id: userId,
      model: modelName,
      timestamp,
      ...metadata
    } = body;

    if (!eventType) {
      return NextResponse.json({ error: 'Event type is required' }, { status: 400 });
    }

    // Insert into analytics table
    const response = await fetch(`${SUPABASE_URL}/rest/v1/analytics`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        event_type: eventType,
        user_id: userId,
        model_name: modelName,
        metadata: metadata
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase insert error:', errorText);
      return NextResponse.json({ error: 'Failed to save analytics' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
  }
}
