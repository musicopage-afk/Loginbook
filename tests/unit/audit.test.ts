import { beforeEach, describe, expect, it, vi } from "vitest";

const create = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditEvent: {
      create
    }
  }
}));

describe("audit logging", () => {
  beforeEach(() => {
    create.mockReset();
    create.mockResolvedValue({ id: "evt_1" });
  });

  it("sanitizes audit payloads before persisting", async () => {
    const { createAuditEvent } = await import("@/lib/audit");

    await createAuditEvent({
      organizationId: "org_1",
      userId: "user_1",
      action: "CREATE",
      entityType: "ENTRY",
      entityId: "entry_1",
      afterJson: {
        title: "hello\nworld"
      }
    });

    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0].data.afterJson).toEqual({
      title: "hello world"
    });
  });
});
