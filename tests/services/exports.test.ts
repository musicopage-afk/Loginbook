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

  it("neutralizes spreadsheet formulas in exported logbook fields", async () => {
    const { exportLogbookCsv } = await import("@/lib/services/exports");
    listEntries.mockResolvedValue([
      {
        id: "entry_2",
        title: "=cmd|' /C calc'!A0",
        body: "@malicious",
        status: "SUBMITTED",
        occurredAt: new Date("2026-03-13T10:00:00.000Z"),
        createdByUser: { displayName: "+admin" },
        tags: [{ tag: { name: "-tag" } }]
      }
    ]);

    const csv = await exportLogbookCsv({
      organizationId: "org_1",
      logbookId: "lb_1",
      userId: "user_1"
    });

    expect(csv).toContain("'=cmd|' /C calc'!A0");
    expect(csv).toContain("'@malicious");
    expect(csv).toContain("'+admin");
    expect(csv).toContain("'-tag");
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

  it("neutralizes spreadsheet formulas in exported audit fields", async () => {
    const { exportAuditCsv } = await import("@/lib/services/exports");
    listAuditEvents.mockResolvedValue([
      {
        id: "evt_2",
        action: "UPDATE",
        entityType: "ENTRY",
        entityId: "=danger",
        userId: "+user",
        occurredAt: new Date("2026-03-13T10:00:00.000Z"),
        ip: "-127.0.0.1",
        userAgent: "@agent"
      }
    ]);

    const csv = await exportAuditCsv({
      organizationId: "org_1",
      userId: "user_1"
    });

    expect(csv).toContain("'=danger");
    expect(csv).toContain("'+user");
    expect(csv).toContain("'-127.0.0.1");
    expect(csv).toContain("'@agent");
  });
});
