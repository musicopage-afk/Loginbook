import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole } from "@prisma/client";

const createAuditEvent = vi.fn();

const prisma = {
  logbook: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  }
};

vi.mock("@/lib/audit", () => ({
  createAuditEvent
}));

vi.mock("@/lib/prisma", () => ({
  prisma
}));

describe("logbook services", () => {
  beforeEach(() => {
    vi.resetModules();
    createAuditEvent.mockReset();
    prisma.logbook.findFirst.mockReset();
    prisma.logbook.create.mockReset();
    prisma.logbook.update.mockReset();
  });

  it("rejects delete for non-admin users", async () => {
    const { deleteLogbook } = await import("@/lib/services/logbooks");

    await expect(
      deleteLogbook({
        organizationId: "org_1",
        userId: "user_1",
        role: UserRole.EDITOR,
        logbookId: "lb_1"
      })
    ).rejects.toMatchObject({ status: 403 });
  });

  it("soft deletes a logbook and records an audit event", async () => {
    const { deleteLogbook } = await import("@/lib/services/logbooks");
    prisma.logbook.findFirst.mockResolvedValue({
      id: "lb_1",
      organizationId: "org_1",
      name: "Ops",
      type: "GENERAL",
      deletedAt: null
    });
    prisma.logbook.update.mockResolvedValue({
      id: "lb_1",
      organizationId: "org_1",
      name: "Ops",
      type: "GENERAL",
      deletedAt: new Date("2026-03-13T12:00:00.000Z")
    });

    const result = await deleteLogbook({
      organizationId: "org_1",
      userId: "user_1",
      role: UserRole.ADMIN,
      logbookId: "lb_1",
      ip: "127.0.0.1",
      userAgent: "vitest"
    });

    expect(result.id).toBe("lb_1");
    expect(prisma.logbook.update).toHaveBeenCalledWith({
      where: { id: "lb_1" },
      data: { deletedAt: expect.any(Date) }
    });
    expect(createAuditEvent).toHaveBeenCalledTimes(1);
  });
});
