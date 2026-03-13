import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireApiUser = vi.fn();
const enforceStateChangingRequest = vi.fn();
const getRequestMeta = vi.fn();
const createLogbook = vi.fn();

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    requireApiUser,
    enforceStateChangingRequest,
    getRequestMeta
  };
});

vi.mock("@/lib/services/logbooks", () => ({
  listLogbooks: vi.fn(),
  createLogbook
}));

describe("POST /api/logbooks", () => {
  beforeEach(() => {
    requireApiUser.mockReset();
    enforceStateChangingRequest.mockReset();
    getRequestMeta.mockReset();
    createLogbook.mockReset();
  });

  it("creates a logbook for an admin", async () => {
    requireApiUser.mockResolvedValue({
      id: "user_1",
      organizationId: "org_1",
      role: "ADMIN"
    });
    getRequestMeta.mockReturnValue({ ip: "127.0.0.1", userAgent: "vitest" });
    createLogbook.mockResolvedValue({ id: "lb_1", name: "Ops", type: "GENERAL" });

    const { POST } = await import("@/app/api/logbooks/route");
    const request = new NextRequest("http://localhost:3000/api/logbooks", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        name: "Ops",
        type: "GENERAL"
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
    expect(createLogbook).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org_1",
        userId: "user_1",
        name: "Ops"
      })
    );
  });
});
