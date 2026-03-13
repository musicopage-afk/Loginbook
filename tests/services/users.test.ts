import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole, UserStatus } from "@prisma/client";

const createAuditEvent = vi.fn();
const hashPassword = vi.fn();

const prisma = {
  entry: {
    findFirst: vi.fn()
  },
  user: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
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
    prisma.entry.findFirst.mockReset();
    prisma.user.findFirst.mockReset();
    prisma.user.create.mockReset();
    prisma.user.update.mockReset();
    prisma.user.delete.mockReset();
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

  it("blocks an administrator from disabling their own account", async () => {
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

  it("allows an administrator to update their own credentials", async () => {
    const { updateUserCredentials } = await import("@/lib/services/users");
    hashPassword.mockResolvedValue("self-hash");
    prisma.user.findFirst
      .mockResolvedValueOnce({
        id: "admin_1",
        organizationId: "org_1",
        email: "admin",
        role: UserRole.ADMIN,
        displayName: "ADMIN User"
      })
      .mockResolvedValueOnce(null);
    prisma.user.update.mockResolvedValue({
      id: "admin_1",
      email: "chief-admin",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE
    });

    const result = await updateUserCredentials(
      {
        organizationId: "org_1",
        userId: "admin_1",
        role: UserRole.ADMIN
      },
      "admin_1",
      {
        username: "chief-admin",
        password: "NewPassword123!",
        role: UserRole.ADMIN
      }
    );

    expect(result.email).toBe("chief-admin");
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "chief-admin",
          passwordHash: "self-hash"
        })
      })
    );
  });

  it("updates a managed account username and password", async () => {
    const { updateUserCredentials } = await import("@/lib/services/users");
    hashPassword.mockResolvedValue("new-hash");
    prisma.user.findFirst
      .mockResolvedValueOnce({
        id: "user_2",
        organizationId: "org_1",
        email: "guard-one",
        role: UserRole.CONTRIBUTOR,
        displayName: "CONTRIBUTOR User"
      })
      .mockResolvedValueOnce(null);
    prisma.user.update.mockResolvedValue({
      id: "user_2",
      email: "guard-two",
      role: UserRole.EDITOR,
      status: UserStatus.ACTIVE
    });

    const result = await updateUserCredentials(
      {
        organizationId: "org_1",
        userId: "admin_1",
        role: UserRole.ADMIN
      },
      "user_2",
      {
        username: "guard-two",
        password: "NewPassword123!",
        role: UserRole.EDITOR
      }
    );

    expect(result.email).toBe("guard-two");
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "guard-two",
          passwordHash: "new-hash",
          role: UserRole.EDITOR
        })
      })
    );
  });

  it("deletes an unreferenced managed account", async () => {
    const { deleteUser } = await import("@/lib/services/users");
    prisma.user.findFirst.mockResolvedValue({
      id: "user_2",
      organizationId: "org_1",
      email: "guard-two",
      role: UserRole.EDITOR,
      displayName: "EDITOR User"
    });
    prisma.entry.findFirst.mockResolvedValue(null);
    prisma.user.delete.mockResolvedValue({
      id: "user_2",
      email: "guard-two"
    });

    const result = await deleteUser(
      {
        organizationId: "org_1",
        userId: "admin_1",
        role: UserRole.ADMIN
      },
      "user_2"
    );

    expect(result.id).toBe("user_2");
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: {
        id: "user_2"
      }
    });
  });

  it("blocks deletion when an account is referenced by log history", async () => {
    const { deleteUser } = await import("@/lib/services/users");
    prisma.user.findFirst.mockResolvedValue({
      id: "user_2",
      organizationId: "org_1",
      email: "guard-two",
      role: UserRole.EDITOR,
      displayName: "EDITOR User"
    });
    prisma.entry.findFirst.mockResolvedValue({ id: "entry_1" });

    await expect(
      deleteUser(
        {
          organizationId: "org_1",
          userId: "admin_1",
          role: UserRole.ADMIN
        },
        "user_2"
      )
    ).rejects.toMatchObject({ status: 409 });
  });
});
