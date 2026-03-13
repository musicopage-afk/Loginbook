import { env } from "@/lib/env";

type Bucket = {
  count: number;
  expiresAt: number;
};

const buckets = new Map<string, Bucket>();

export function assertRateLimit(key: string, maxAttempts = env.rateLimitMaxAttempts) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.expiresAt < now) {
    buckets.set(key, {
      count: 1,
      expiresAt: now + env.rateLimitWindowMs
    });
    return;
  }

  if (existing.count >= maxAttempts) {
    throw new Error("Too many attempts. Try again later.");
  }

  existing.count += 1;
  buckets.set(key, existing);
}
