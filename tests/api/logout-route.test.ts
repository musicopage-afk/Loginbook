import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getCurrentSession = vi.fn();
const revokeSessionByToken = vi.fn();
const createAuditEvent = vi.fn();
const enforceStateChangingRequest = vi.fn();
const getRequestMeta = vi.fn();
const getRequestSessionToken = vi.fn();
const issueCsrfToken = vi.fn();

vi.mock("@/lib/auth", () => ({
  getCurrentSession,
  revokeSessionByToken
}));

vi.mock("@/lib/audit", () => ({
  createAuditEvent
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    enforceStateChangingRequest,
    getRequestMeta
  };
});

vi.mock("@/lib/security", () => ({
  getRequestSessionToken,
  issueCsrfToken
}));

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    getCurrentSession.mockReset();
    revokeSessionByToken.mockReset();
    createAuditEvent.mockReset();
    enforceStateChangingRequest.mockReset();
    getRequestMeta.mockReset();
    getRequestSessionToken.mockReset();
    issueCsrfToken.mockReset();
    enforceStateChangingRequest.mockResolvedValue(undefined);
    getRequestMeta.mockReturnValue({ ip: "127.0.0.1", userAgent: "vitest" });
  });

  it("revokes the active session and writes a logout audit event", async () => {
    getCurrentSession.mockResolvedValue({
      id: "sess_1",
      user: {
        id: "user_1",
        organizationId: "org_1"
      }
    });
    getRequestSessionToken.mockResolvedValue("raw-session-token");

    const { POST } = await import("@/app/api/auth/logout/route");
    const response = await POST(new NextRequest("http://localhost:3000/api/auth/logout", { method: "POST" }));

    expect(response.status).toBe(200);
    expect(revokeSessionByToken).toHaveBeenCalledWith("raw-session-token");
    expect(createAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
      action: "LOGOUT",
      entityType: "SESSION"
    }));
  });
});
