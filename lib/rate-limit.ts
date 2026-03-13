import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { ApiError } from "@/lib/api";

function normalizeThrottleKey(key: string) {
  return key.trim().toLowerCase();
}

export async function assertRateLimit(key: string, maxAttempts = env.rateLimitMaxAttempts) {
  const normalizedKey = normalizeThrottleKey(key);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + env.rateLimitWindowMs);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.loginThrottle.findUnique({
      where: {
        key: normalizedKey
      }
    });

    if (!existing || existing.expiresAt <= now) {
      await tx.loginThrottle.upsert({
        where: {
          key: normalizedKey
        },
        update: {
          count: 1,
          expiresAt
        },
        create: {
          key: normalizedKey,
          count: 1,
          expiresAt
        }
      });
      return;
    }

    if (existing.count >= maxAttempts) {
      throw new ApiError(429, "Too many attempts. Try again later.");
    }

    await tx.loginThrottle.update({
      where: {
        key: normalizedKey
      },
      data: {
        count: {
          increment: 1
        }
      }
    });
  });
}
