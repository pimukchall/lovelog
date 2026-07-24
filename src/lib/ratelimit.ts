import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 5 requests per 1 minute per IP
export const authRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  prefix: "lovelog:auth",
});

// 3 requests per 10 minutes per IP (forgot password)
export const forgotRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "10 m"),
  prefix: "lovelog:forgot",
});
