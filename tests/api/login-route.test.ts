import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const authenticate = vi.fn();
const createSession = vi.fn();
const revokeSessionByToken = vi.fn();
const createAuditEvent = vi.fn();
const issueCsrfToken = vi.fn();
const getRequestSessionToken = vi.fn();
const assertRateLimit = vi.fn();
const enforceStateChangingRequest = vi.fn();
const getRequestMeta = vi.fn();

vi.mock("@/lib/auth", () => ({
  authenticate,
  createSession,
  revokeSessionByToken
}));

vi.mock("@/lib/audit", () => ({
  createAuditEvent
}));

vi.mock("@/lib/security", () => ({
  issueCsrfToken,
  getRequestSessionToken
}));

vi.mock("@/lib/rate-limit", () => ({
  assertRateLimit
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    enforceStateChangingRequest,
    getRequestMeta
  };
});

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    authenticate.mockReset();
    createSession.mockReset();
    revokeSessionByToken.mockReset();
    createAuditEvent.mockReset();
    issueCsrfToken.mockReset();
    getRequestSessionToken.mockReset();
    assertRateLimit.mockReset();
    enforceStateChangingRequest.mockReset();
    getRequestMeta.mockReset();
    enforceStateChangingRequest.mockResolvedValue(undefined);
    getRequestMeta.mockReturnValue({ ip: "127.0.0.1", userAgent: "vitest" });
  });

  it("returns 401 for invalid credentials", async () => {
    authenticate.mockResolvedValue({
      ok: false,
      reason: "INVALID_PASSWORD"
    });
    const { POST } = await import("@/app/api/auth/login/route");
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: "nobody@example.com",
        password: "WrongPass123!"
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: "Invalid password" });
  });

  it("creates a session and audit event for valid credentials", async () => {
    authenticate.mockResolvedValue({
      ok: true,
      user: {
        id: "user_1",
        email: "admin@loginbook.local",
        role: "ADMIN",
        organizationId: "org_1"
      }
    });
    getRequestSessionToken.mockResolvedValue(null);
    createSession.mockResolvedValue({
      session: { id: "sess_1" }
    });

    const { POST } = await import("@/app/api/auth/login/route");
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        "content-type": "application/json",
        "user-agent": "vitest"
      },
      body: JSON.stringify({
        email: "admin@loginbook.local",
        password: "ChangeMe123!"
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(createSession).toHaveBeenCalledWith("user_1");
    expect(createAuditEvent).toHaveBeenCalledTimes(1);
  });
});
