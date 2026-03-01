export default async function handler(request, response) {
  // 1. Enable CORS (Cross-Origin Resource Sharing)
  // This allows your HTML file to talk to this API even if they are on different subdomains (sometimes relevant)
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request for CORS
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  // 2. Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const data = request.body;
    
    // --- DATABASE STORAGE (Supabase) ---
    const { SUPABASE_URL, SUPABASE_KEY } = process.env;

    if (SUPABASE_URL && SUPABASE_KEY) {
      // Send to Supabase via REST API (No npm dependencies needed)
      const dbResponse = await fetch(`${SUPABASE_URL}/rest/v1/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          event_type: data.event,
          user_id: data.user_id,
          model_name: data.model,
          metadata: data // Store full payload as JSONB
        })
      });

      if (!dbResponse.ok) {
        const errText = await dbResponse.text();
        console.error("Supabase Error:", errText);
        // Don't fail the client request, just log error
      } else {
        console.log("✅ Saved to Supabase");
      }
    } else {
      console.log("📝 (Log Only - No DB Configured) EVENT:");
      console.log(JSON.stringify(data, null, 2));
    }

    return response.status(200).json({ success: true });

  } catch (error) {
    console.error("Tracking Error:", error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}
