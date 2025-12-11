import type { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  rateLimitStore.forEach((value, key) => {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  windowMs: number;  // Time window in milliseconds
  max: number;       // Maximum requests per window
  message?: string;  // Error message
  keyGenerator?: (req: Request) => string;  // Custom key generator
}

export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs = 60 * 1000,  // 1 minute default
    max = 100,             // 100 requests default
    message = "عذراً، لقد تجاوزت الحد المسموح من الطلبات. حاول مرة أخرى لاحقاً.",
    keyGenerator = (req: Request) => {
      // Use user ID if authenticated, otherwise use IP
      const userId = (req.user as any)?.claims?.sub;
      return userId || req.ip || req.socket.remoteAddress || "unknown";
    },
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    let entry = rateLimitStore.get(key);
    
    if (!entry || entry.resetTime < now) {
      // Create new entry
      entry = {
        count: 1,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, entry);
    } else {
      entry.count++;
    }

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - entry.count));
    res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetTime / 1000));

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.setHeader("Retry-After", retryAfter);
      return res.status(429).json({
        message,
        retryAfter,
      });
    }

    next();
  };
}

// Pre-configured rate limiters
export const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000,  // 1 minute
  max: 100,             // 100 requests per minute
});

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 login attempts
  message: "عدد محاولات كثيرة جداً. حاول مرة أخرى بعد 15 دقيقة.",
});

export const chatLimiter = createRateLimiter({
  windowMs: 60 * 1000,  // 1 minute
  max: 20,              // 20 chat messages per minute
  message: "عدد الرسائل كثير جداً. انتظر قليلاً قبل إرسال رسائل إضافية.",
});

export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 1000,  // 1 minute
  max: 10,              // 10 uploads per minute
  message: "عدد الملفات المرفوعة كثير جداً. حاول مرة أخرى لاحقاً.",
});
