import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";

const getCurrentSession = vi.fn();
const validateOrigin = vi.fn();
const validateSignedCsrf = vi.fn();
const getClientIp = vi.fn();
const getUserAgent = vi.fn();

vi.mock("@/lib/auth", () => ({
  getCurrentSession
}));

vi.mock("@/lib/security", () => ({
  validateOrigin,
  validateSignedCsrf,
  getClientIp,
  getUserAgent
}));

describe("api helpers", () => {
  beforeEach(() => {
    getCurrentSession.mockReset();
    validateOrigin.mockReset();
    validateSignedCsrf.mockReset();
    getClientIp.mockReset();
    getUserAgent.mockReset();
  });

  it("requires an authenticated user and enforces role floor", async () => {
    const { requireApiUser } = await import("@/lib/api");

    getCurrentSession.mockResolvedValueOnce(null);
    await expect(requireApiUser()).rejects.toMatchObject({ status: 401 });

    getCurrentSession.mockResolvedValueOnce({
      user: {
        role: UserRole.READER
      }
    });
    await expect(requireApiUser(UserRole.ADMIN)).rejects.toMatchObject({ status: 403 });

    getCurrentSession.mockResolvedValueOnce({
      user: {
        id: "user_1",
        role: UserRole.ADMIN
      }
    });
    await expect(requireApiUser(UserRole.APPROVER)).resolves.toMatchObject({ id: "user_1" });
  });

  it("rejects state-changing requests when csrf checks fail", async () => {
    const { enforceStateChangingRequest } = await import("@/lib/api");
    const request = new NextRequest("http://localhost:3000/api/logbooks", {
      method: "POST",
      headers: {
        "x-csrf-token": "token.sig",
        cookie: "loginbook_csrf=token.sig"
      }
    });

    validateOrigin.mockReturnValue(false);
    validateSignedCsrf.mockReturnValue(true);

    await expect(enforceStateChangingRequest(request)).rejects.toMatchObject({ status: 403 });
  });

  it("returns request metadata from security helpers", async () => {
    const { getRequestMeta } = await import("@/lib/api");
    const request = new NextRequest("http://localhost:3000/api/logbooks");

    getClientIp.mockReturnValue("198.51.100.10");
    getUserAgent.mockReturnValue("vitest");

    expect(getRequestMeta(request)).toEqual({
      ip: "198.51.100.10",
      userAgent: "vitest"
    });
  });
});
