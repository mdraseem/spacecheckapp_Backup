import { NextRequest } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number;

  /**
   * Time window in milliseconds
   */
  windowMs: number;

  /**
   * Optional custom identifier function (defaults to IP address)
   */
  getIdentifier?: (req: NextRequest) => string;
}

/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or Upstash
 */
export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const identifier = config.getIdentifier
    ? config.getIdentifier(req)
    : getIP(req);

  const key = `ratelimit:${identifier}`;
  const now = Date.now();

  // Initialize or get existing rate limit data
  if (!store[key] || store[key].resetTime < now) {
    store[key] = {
      count: 0,
      resetTime: now + config.windowMs
    };
  }

  // Increment count
  store[key].count++;

  const isAllowed = store[key].count <= config.maxRequests;

  return {
    success: isAllowed,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - store[key].count),
    reset: store[key].resetTime
  };
}

/**
 * Get client IP address from request
 */
function getIP(req: NextRequest): string {
  // Check various headers for IP (Vercel, Cloudflare, etc.)
  const forwarded = req.headers.get('x-forwarded-for');
  const real = req.headers.get('x-real-ip');
  const cfConnecting = req.headers.get('cf-connecting-ip');

  if (cfConnecting) return cfConnecting;
  if (real) return real;
  if (forwarded) return forwarded.split(',')[0].trim();

  return 'unknown';
}

/**
 * Create a rate limit response with headers
 */
export function rateLimitResponse(
  message: string = 'Too many requests, please try again later.',
  result: { limit: number; remaining: number; reset: number }
) {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.reset).toISOString(),
        'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString()
      }
    }
  );
}
