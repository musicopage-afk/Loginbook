import { describe, expect, it } from "vitest";
import { UserRole } from "@prisma/client";
import { canApproveEntry, canCreateEntry, canCreateLogbook, canViewAudit, hasRole } from "@/lib/rbac";

describe("rbac", () => {
  it("applies role ranking correctly", () => {
    expect(hasRole(UserRole.ADMIN, UserRole.APPROVER)).toBe(true);
    expect(hasRole(UserRole.READER, UserRole.EDITOR)).toBe(false);
  });

  it("gates features by role", () => {
    expect(canCreateEntry(UserRole.CONTRIBUTOR)).toBe(true);
    expect(canApproveEntry(UserRole.EDITOR)).toBe(false);
    expect(canViewAudit(UserRole.AUDITOR)).toBe(true);
    expect(canCreateLogbook(UserRole.ADMIN)).toBe(true);
  });
});
