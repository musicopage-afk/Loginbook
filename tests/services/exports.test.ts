import { beforeEach, describe, expect, it, vi } from "vitest";

const createAuditEvent = vi.fn();
const listEntries = vi.fn();
const listAuditEvents = vi.fn();

vi.mock("@/lib/audit", () => ({
  createAuditEvent
}));

vi.mock("@/lib/services/entries", () => ({
  listEntries
}));

vi.mock("@/lib/services/audit", () => ({
  listAuditEvents
}));

describe("export services", () => {
  beforeEach(() => {
    createAuditEvent.mockReset();
    listEntries.mockReset();
    listAuditEvents.mockReset();
  });

  it("exports logbook entries to csv and audits the export", async () => {
    const { exportLogbookCsv } = await import("@/lib/services/exports");
    listEntries.mockResolvedValue([
      {
        id: "entry_1",
        title: "Shift handover",
        body: "All checks complete",
        status: "APPROVED",
        occurredAt: new Date("2026-03-13T10:00:00.000Z"),
        createdByUser: { displayName: "Admin User" },
        tags: [{ tag: { name: "handover" } }]
      }
    ]);

    const csv = await exportLogbookCsv({
      organizationId: "org_1",
      logbookId: "lb_1",
      userId: "user_1"
    });

    expect(csv).toContain("Shift handover");
    expect(csv).toContain("handover");
    expect(createAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
      action: "EXPORT",
      entityType: "LOGBOOK"
    }));
  });

  it("exports audit events to csv and audits the export", async () => {
    const { exportAuditCsv } = await import("@/lib/services/exports");
    listAuditEvents.mockResolvedValue([
      {
        id: "evt_1",
        action: "CREATE",
        entityType: "ENTRY",
        entityId: "entry_1",
        userId: "user_1",
        occurredAt: new Date("2026-03-13T10:00:00.000Z"),
        ip: "127.0.0.1",
        userAgent: "vitest"
      }
    ]);

    const csv = await exportAuditCsv({
      organizationId: "org_1",
      userId: "user_1"
    });

    expect(csv).toContain("evt_1");
    expect(csv).toContain("CREATE");
    expect(createAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
      action: "EXPORT",
      entityType: "AUDIT_EVENT"
    }));
  });
});
