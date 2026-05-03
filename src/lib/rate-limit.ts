/**
 * Simple in-memory rate limiter for API routes and Server Actions.
 * For production at scale, swap to Redis-based (e.g., @upstash/ratelimit).
 *
 * Usage:
 *   const limiter = createRateLimiter({ maxRequests: 20, windowMs: 60_000 })
 *   const { success } = limiter.check(userId)
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimiterOptions {
  /** Max requests allowed in the window */
  maxRequests: number
  /** Window duration in milliseconds */
  windowMs: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

const stores = new Map<string, Map<string, RateLimitEntry>>()

// Periodic cleanup every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const store of stores.values()) {
    for (const [key, entry] of store) {
      if (now > entry.resetAt) {
        store.delete(key)
      }
    }
  }
}, 5 * 60 * 1000)

export function createRateLimiter(options: RateLimiterOptions) {
  const storeKey = `${options.maxRequests}-${options.windowMs}`
  if (!stores.has(storeKey)) {
    stores.set(storeKey, new Map())
  }
  const store = stores.get(storeKey)!

  return {
    check(identifier: string): RateLimitResult {
      const now = Date.now()
      const entry = store.get(identifier)

      // Window expired or new user — reset
      if (!entry || now > entry.resetAt) {
        store.set(identifier, {
          count: 1,
          resetAt: now + options.windowMs,
        })
        return {
          success: true,
          remaining: options.maxRequests - 1,
          resetAt: now + options.windowMs,
        }
      }

      // Within window — increment
      entry.count++

      if (entry.count > options.maxRequests) {
        return {
          success: false,
          remaining: 0,
          resetAt: entry.resetAt,
        }
      }

      return {
        success: true,
        remaining: options.maxRequests - entry.count,
        resetAt: entry.resetAt,
      }
    },
  }
}

// ── Pre-configured limiters ──────────────────────────────────────────

/** AI chat: 30 requests per hour per user */
export const aiChatLimiter = createRateLimiter({
  maxRequests: 30,
  windowMs: 60 * 60_000, // 1 hour
})

/** Auth routes: 10 attempts per 15 minutes per IP */
export const authLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 15 * 60_000,
})

/** General API / uploads: 60 requests per minute */
export const apiLimiter = createRateLimiter({
  maxRequests: 60,
  windowMs: 60_000,
})

/** Community posts: 20 posts per hour per user */
export const postLimiter = createRateLimiter({
  maxRequests: 20,
  windowMs: 60 * 60_000,
})

/** Community comments: 60 comments per hour per user */
export const commentLimiter = createRateLimiter({
  maxRequests: 60,
  windowMs: 60 * 60_000,
})

/** Media uploads: 30 files per hour per user */
export const uploadLimiter = createRateLimiter({
  maxRequests: 30,
  windowMs: 60 * 60_000,
})
