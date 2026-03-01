// API endpoint to fetch analytics data from Supabase
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple password authentication via query param or header
  const password = req.headers.authorization?.replace('Bearer ', '') || req.query.password;
  const ANALYTICS_PASSWORD = process.env.ANALYTICS_PASSWORD;

  if (password !== ANALYTICS_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase configuration missing' });
  }

  try {
    // Fetch analytics data from Supabase
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/analytics?order=created_at.desc&limit=1000`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase request failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Process and aggregate the data
    const stats = processAnalytics(data);

    return res.status(200).json({
      success: true,
      stats,
      rawData: data
    });

  } catch (error) {
    console.error('Analytics fetch error:', error);
    return res.status(500).json({
      error: 'Failed to fetch analytics',
      message: error.message
    });
  }
}

function processAnalytics(data) {
  const stats = {
    totalEvents: data.length,
    uniqueUsers: new Set(),
    eventCounts: {},
    modelViews: {},
    devices: {
      ios: 0,
      android: 0,
      desktop: 0
    },
    languages: {},
    arStats: {
      clicks: 0,
      activations: 0,
      errors: 0,
      notAvailable: 0
    },
    recentEvents: [],
    timeline: {}
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
    let metadata = {};
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
  stats.uniqueUsers = stats.uniqueUsers.size;

  // Calculate AR conversion rate
  stats.arStats.conversionRate = stats.arStats.clicks > 0
    ? ((stats.arStats.activations / stats.arStats.clicks) * 100).toFixed(2)
    : 0;

  return stats;
}
