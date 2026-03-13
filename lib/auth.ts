import argon2 from "argon2";
import { Prisma, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  clearSessionCookie,
  getRequestSessionToken,
  randomToken,
  setSessionCookie,
  sha256
} from "@/lib/security";

const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

export async function hashPassword(password: string) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1
  });
}

export async function verifyPassword(password: string, passwordHash: string) {
  return argon2.verify(passwordHash, password);
}

export async function authenticate(email: string, password: string) {
  const user = await prisma.user.findFirst({
    where: {
      email: email.toLowerCase(),
      status: UserStatus.ACTIVE
    }
  });

  if (!user) {
    return null;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  return user;
}

export async function createSession(userId: string) {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash: sha256(token),
      expiresAt
    }
  });

  await setSessionCookie(token, expiresAt);

  return { session, token };
}

export async function revokeSessionByToken(token: string) {
  await prisma.session.updateMany({
    where: {
      tokenHash: sha256(token),
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  });
  await clearSessionCookie();
}

export async function getCurrentSession() {
  const token = await getRequestSessionToken();
  if (!token) {
    return null;
  }

  const tokenHash = sha256(token);
  const session = await prisma.session.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      user: true
    }
  });

  return session;
}

export async function requireUser() {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function withTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
  return prisma.$transaction((tx) => fn(tx));
}
