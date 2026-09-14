import type { NextFunction, Request, Response } from "express";

interface Bucket { count: number; resetAt: number; }
const buckets = new Map<string, Bucket>();

function rateLimit(windowMs: number, max: number, keyPrefix: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = `${keyPrefix}:${req.ip || req.socket.remoteAddress || "unknown"}`;
    const current = buckets.get(key);
    const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
    bucket.count += 1;
    buckets.set(key, bucket);
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - bucket.count));
    res.setHeader("X-RateLimit-Reset", Math.ceil(bucket.resetAt / 1000));
    if (bucket.count > max) {
      res.status(429).json({ message: "Too many requests. Please try again later." });
      return;
    }
    next();
  };
}

export const apiRateLimit = rateLimit(60_000, 120, "api");
export const webhookRateLimit = rateLimit(60_000, 300, "webhook");

export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
}
