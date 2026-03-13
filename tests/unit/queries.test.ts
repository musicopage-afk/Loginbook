import { describe, expect, it } from "vitest";
import { buildAuditWhere, buildEntryWhere } from "@/lib/queries";

describe("query builders", () => {
  it("builds entry filters with tenant scoping and search terms", () => {
    const where = buildEntryWhere("org_1", "lb_1", {
      from: "2026-03-01T00:00:00.000Z",
      to: "2026-03-31T23:59:59.000Z",
      tag: "handover",
      author: "user_1",
      status: "APPROVED",
      q: "generator"
    });

    expect(where.logbook).toEqual({ organizationId: "org_1" });
    expect(where.createdByUserId).toBe("user_1");
    expect(where.status).toBe("APPROVED");
    expect(where.tags).toEqual({
      some: {
        tag: {
          name: "handover"
        }
      }
    });
    expect(where.OR).toHaveLength(2);
  });

  it("builds audit filters with date constraints", () => {
    const where = buildAuditWhere("org_1", {
      userId: "user_1",
      action: "EXPORT",
      entityType: "LOGBOOK",
      from: "2026-03-01T00:00:00.000Z",
      to: "2026-03-31T23:59:59.000Z"
    });

    expect(where).toMatchObject({
      organizationId: "org_1",
      userId: "user_1",
      action: "EXPORT",
      entityType: "LOGBOOK"
    });
  });
});
