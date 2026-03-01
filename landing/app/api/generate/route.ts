import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, rateLimitResponse } from '@/utils/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limit: 10 requests per hour
  const rateLimitResult = await rateLimit(request, {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000 // 1 hour
  })

  if (!rateLimitResult.success) {
    return rateLimitResponse('Too many generation requests. Please try again later.', rateLimitResult)
  }

  try {
    const body = await request.json()
    const { imageUrl, dimensions, generationId } = body

    if (!imageUrl || !dimensions || !generationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Call the Modal Web Endpoint
    // Note: In production, this URL should be in an environment variable
    // e.g., process.env.MODAL_API_URL
    // For now, we assume the user will deploy the modal app and get a URL like:
    // https://<username>--spacecheck-backend-generate.modal.run
    
    const modalUrl = process.env.MODAL_API_URL

    if (!modalUrl) {
      console.error("MODAL_API_URL is not set")
      // In a real scenario, we might fail here, but for now we'll just log it 
      // and pretend we queued it if testing locally without the deployed backend.
      return NextResponse.json(
        { error: 'Backend configuration missing' },
        { status: 500 }
      )
    }

    // Log the configuration
    console.log("Triggering Modal Endpoint:", modalUrl);
    console.log("Payload:", JSON.stringify({ imageUrl, dimensions, generationId }));

    // Await the response
    try {
        const response = await fetch(modalUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl, dimensions, generationId })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Modal API Error:", response.status, errorText);
            return NextResponse.json(
                { error: `Modal API Error: ${response.statusText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log("Modal Response:", data);
        
        return NextResponse.json({ status: 'queued', data });

    } catch (fetchError) {
        console.error("Fetch failed:", fetchError);
        return NextResponse.json(
            { error: 'Failed to connect to backend service' },
            { status: 502 }
        );
    }

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
