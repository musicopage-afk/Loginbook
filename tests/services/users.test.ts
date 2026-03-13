import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole, UserStatus } from "@prisma/client";

const createAuditEvent = vi.fn();
const hashPassword = vi.fn();

const prisma = {
  user: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  }
};

vi.mock("@/lib/audit", () => ({
  createAuditEvent
}));

vi.mock("@/lib/auth", () => ({
  hashPassword
}));

vi.mock("@/lib/prisma", () => ({
  prisma
}));

describe("user services", () => {
  beforeEach(() => {
    vi.resetModules();
    createAuditEvent.mockReset();
    hashPassword.mockReset();
    prisma.user.findMany.mockReset();
    prisma.user.findFirst.mockReset();
    prisma.user.create.mockReset();
    prisma.user.update.mockReset();
  });

  it("creates an account without needing a display name", async () => {
    const { createUser } = await import("@/lib/services/users");
    hashPassword.mockResolvedValue("hashed-password");
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: "user_2",
      email: "guard-one",
      displayName: "CONTRIBUTOR User",
      role: UserRole.CONTRIBUTOR,
      status: UserStatus.ACTIVE
    });

    const result = await createUser(
      {
        organizationId: "org_1",
        userId: "admin_1",
        role: UserRole.ADMIN
      },
      {
        username: "guard-one",
        password: "ChangeMe123!",
        role: UserRole.CONTRIBUTOR
      }
    );

    expect(result.email).toBe("guard-one");
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          displayName: "CONTRIBUTOR User"
        })
      })
    );
  });

  it("blocks an administrator from managing their own account", async () => {
    const { updateUserStatus } = await import("@/lib/services/users");

    await expect(
      updateUserStatus(
        {
          organizationId: "org_1",
          userId: "admin_1",
          role: UserRole.ADMIN
        },
        "admin_1",
        UserStatus.DISABLED
      )
    ).rejects.toMatchObject({ status: 409 });
  });
});
