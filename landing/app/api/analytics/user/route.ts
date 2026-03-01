import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const modelFilter = searchParams.get('model'); // Optional model filter

  try {
    // Get all models belonging to this user
    const { data: userGenerations, error: genError } = await supabase
      .from('generations')
      .select('glb_url')
      .eq('user_id', user.id);

    if (genError) {
      throw new Error(`Failed to fetch user models: ${genError.message}`);
    }

    // Extract model names from URLs (e.g., "kler/bach.glb" from full URL)
    const userModelNames = userGenerations
      ?.map(gen => gen.glb_url?.split('/').slice(-2).join('/'))
      .filter(Boolean) || [];

    if (userModelNames.length === 0) {
      return NextResponse.json({
        success: true,
        stats: getEmptyStats(),
        rawData: []
      });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    // Fetch analytics data for user's models only
    let queryUrl = `${SUPABASE_URL}/rest/v1/analytics?order=created_at.desc&limit=1000`;

    // If specific model requested, verify it belongs to user
    if (modelFilter) {
      const requestedModel = modelFilter.split('/').slice(-2).join('/');
      if (!userModelNames.includes(requestedModel)) {
        return NextResponse.json({ error: 'Model not found' }, { status: 404 });
      }
      queryUrl += `&model_name=eq.${encodeURIComponent(modelFilter)}`;
    } else {
      // Filter to only user's models
      const modelFilters = userModelNames.map(name => `model_name.eq.${encodeURIComponent(name)}`).join(',');
      if (userModelNames.length === 1) {
        queryUrl += `&model_name=eq.${encodeURIComponent(userModelNames[0])}`;
      } else {
        queryUrl += `&or=(${modelFilters})`;
      }
    }

    const response = await fetch(queryUrl, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Supabase request failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Process and aggregate the data
    const stats = processAnalytics(data);

    return NextResponse.json({
      success: true,
      stats,
      rawData: data
    });

  } catch (error: any) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({
      error: 'Failed to fetch analytics',
      message: error.message
    }, { status: 500 });
  }
}

function getEmptyStats() {
  return {
    totalEvents: 0,
    uniqueUsers: 0,
    eventCounts: {},
    modelViews: {},
    devices: { ios: 0, android: 0, desktop: 0 },
    languages: {},
    arStats: {
      clicks: 0,
      activations: 0,
      errors: 0,
      notAvailable: 0,
      conversionRate: '0'
    },
    recentEvents: [],
    timeline: {}
  };
}

function processAnalytics(data: any[]) {
  const stats = {
    totalEvents: data.length,
    uniqueUsers: new Set(),
    eventCounts: {} as Record<string, number>,
    modelViews: {} as Record<string, number>,
    devices: {
      ios: 0,
      android: 0,
      desktop: 0
    },
    languages: {} as Record<string, number>,
    arStats: {
      clicks: 0,
      activations: 0,
      errors: 0,
      notAvailable: 0,
      conversionRate: '0'
    },
    recentEvents: [] as any[],
    timeline: {} as Record<string, number>
  };

  data.forEach(item => {
    // Unique users
    if (item.user_id) {
      stats.uniqueUsers.add(item.user_id);
    }

    // Event counts
    const eventType = item.event_type || 'unknown';
    stats.eventCounts[eventType] = (stats.eventCounts[eventType] || 0) + 1;

    // Model views
    if (item.model_name) {
      stats.modelViews[item.model_name] = (stats.modelViews[item.model_name] || 0) + 1;
    }

    // Parse metadata
    let metadata: any = {};
    if (item.metadata) {
      metadata = typeof item.metadata === 'string'
        ? JSON.parse(item.metadata)
        : item.metadata;
    }

    // Device detection
    const userAgent = metadata.userAgent || '';
    const isIOS = metadata.ios || userAgent.includes('iPhone') || userAgent.includes('iPad');
    const isAndroid = userAgent.includes('Android');

    if (isIOS) {
      stats.devices.ios++;
    } else if (isAndroid) {
      stats.devices.android++;
    } else {
      stats.devices.desktop++;
    }

    // Languages
    if (metadata.language) {
      stats.languages[metadata.language] = (stats.languages[metadata.language] || 0) + 1;
    }

    // AR statistics
    if (eventType === 'click_ar_view') stats.arStats.clicks++;
    if (eventType === 'ar_activated_success') stats.arStats.activations++;
    if (eventType === 'ar_activation_error') stats.arStats.errors++;
    if (eventType === 'ar_not_available') stats.arStats.notAvailable++;

    // Timeline data (group by date)
    if (item.created_at) {
      const date = item.created_at.split('T')[0];
      stats.timeline[date] = (stats.timeline[date] || 0) + 1;
    }

    // Recent events (first 50)
    if (stats.recentEvents.length < 50) {
      stats.recentEvents.push({
        event: eventType,
        model: item.model_name,
        timestamp: item.created_at,
        device: isIOS ? 'iOS' : isAndroid ? 'Android' : 'Desktop',
        ...metadata
      });
    }
  });

  // Convert unique users Set to count
  stats.uniqueUsers = stats.uniqueUsers.size as any;

  // Calculate AR conversion rate
  stats.arStats.conversionRate = stats.arStats.clicks > 0
    ? ((stats.arStats.activations / stats.arStats.clicks) * 100).toFixed(2)
    : '0';

  return stats;
}
