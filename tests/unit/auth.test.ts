import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
  headers: vi.fn()
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: vi.fn()
    },
    session: {
      create: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn()
    }
  }
}));

describe("auth password hashing", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("hashes and verifies passwords with argon2", async () => {
    const { hashPassword, verifyPassword } = await import("@/lib/auth");
    const hash = await hashPassword("ChangeMe123!");

    expect(hash).not.toContain("ChangeMe123!");
    await expect(verifyPassword("ChangeMe123!", hash)).resolves.toBe(true);
    await expect(verifyPassword("WrongPass123!", hash)).resolves.toBe(false);
  });
});
