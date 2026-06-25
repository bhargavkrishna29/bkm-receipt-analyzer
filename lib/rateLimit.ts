// lib/rateLimit.ts — In-memory per-IP rate limiter (same logic as old server.js)

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX ?? '10');
const RATE_LIMIT_WINDOW_MS = parseInt(
  process.env.RATE_LIMIT_WINDOW_MS ?? String(60 * 60 * 1000)
);

// Clean up stale entries every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 30 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  windowMs: number;
  retryAfter?: number;
  ip: string;
}

export function getClientIP(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

export function checkRateLimit(request: Request): RateLimitResult {
  const ip = getClientIP(request);
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, limit: RATE_LIMIT_MAX, windowMs: RATE_LIMIT_WINDOW_MS, ip };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, limit: RATE_LIMIT_MAX, windowMs: RATE_LIMIT_WINDOW_MS, retryAfter, ip };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, limit: RATE_LIMIT_MAX, windowMs: RATE_LIMIT_WINDOW_MS, ip };
}

export { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS };
