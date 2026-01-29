/**
 * Rate limiting implementation for API routes
 * Uses in-memory storage for development, should use Redis in production
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory storage (replace with Redis for production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the window
   */
  maxRequests: number;

  /**
   * Time window in seconds
   */
  windowSeconds: number;

  /**
   * Optional key prefix for namespacing
   */
  keyPrefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Get client identifier from request
 * Uses IP address, falling back to a default for development
 */
function getClientId(request: Request): string {
  // Try to get real IP from headers (for production behind proxy)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // For development
  return "127.0.0.1";
}

/**
 * Check rate limit for a request
 */
export function checkRateLimit(
  request: Request,
  config: RateLimitConfig
): RateLimitResult {
  const clientId = getClientId(request);
  const key = config.keyPrefix ? `${config.keyPrefix}:${clientId}` : clientId;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  let entry = rateLimitStore.get(key);

  // Create new entry if doesn't exist or expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  // Increment count
  entry.count++;

  const success = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);

  return {
    success,
    limit: config.maxRequests,
    remaining,
    reset: Math.ceil(entry.resetAt / 1000), // Unix timestamp in seconds
  };
}

/**
 * Rate limit headers for response
 */
export function getRateLimitHeaders(
  result: RateLimitResult
): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.toString(),
  };
}

/**
 * Common rate limit configurations
 */
export const RATE_LIMITS = {
  // Strict limit for write operations
  WRITE: {
    maxRequests: 10,
    windowSeconds: 60,
  },
  // Moderate limit for read operations
  READ: {
    maxRequests: 100,
    windowSeconds: 60,
  },
  // Generous limit for map tiles and static content
  STATIC: {
    maxRequests: 500,
    windowSeconds: 60,
  },
} as const;
