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

  it("only returns active sessions for active users", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { cookies } = await import("next/headers");
    const cookieStore = {
      get: vi.fn().mockReturnValue({ value: "raw-session-token" })
    };
    vi.mocked(cookies).mockResolvedValue(cookieStore as never);
    vi.mocked(prisma.session.findFirst).mockResolvedValue(null);

    const { getCurrentSession } = await import("@/lib/auth");
    const session = await getCurrentSession();

    expect(session).toBeNull();
    expect(prisma.session.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          user: {
            status: "ACTIVE"
          }
        })
      })
    );
  });
});
