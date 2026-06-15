/**
 * Edge Middleware — Rate Limiting & Security
 *
 * Applied to all /api/* routes.
 * Uses a simple in-memory sliding window per IP (resets on cold start).
 * For production scale, replace with Upstash Redis or similar.
 */
import { NextRequest, NextResponse } from 'next/server';

/** Max requests per window per IP */
const RATE_LIMIT = 30;
/** Window duration in milliseconds */
const WINDOW_MS = 60_000; // 1 minute

interface RateEntry {
  count: number;
  windowStart: number;
}

// Edge-compatible in-memory store (per isolate)
const rateLimitStore = new Map<string, RateEntry>();

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

export function middleware(req: NextRequest) {
  // Only rate-limit API routes
  if (!req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const ip = getClientIp(req);
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    // New window
    rateLimitStore.set(ip, { count: 1, windowStart: now });
    return NextResponse.next();
  }

  if (entry.count >= RATE_LIMIT) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - entry.windowStart)) / 1000);
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests. Please slow down.', retryAfterSeconds: retryAfter }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(RATE_LIMIT),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  entry.count++;
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT));
  response.headers.set('X-RateLimit-Remaining', String(RATE_LIMIT - entry.count));
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
