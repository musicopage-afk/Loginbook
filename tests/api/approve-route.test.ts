import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireApiUser = vi.fn();
const enforceStateChangingRequest = vi.fn();
const getRequestMeta = vi.fn();
const approveEntry = vi.fn();

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    requireApiUser,
    enforceStateChangingRequest,
    getRequestMeta
  };
});

vi.mock("@/lib/services/entries", () => ({
  approveEntry
}));

describe("POST /api/entries/[id]/approve", () => {
  beforeEach(() => {
    requireApiUser.mockReset();
    enforceStateChangingRequest.mockReset();
    getRequestMeta.mockReset();
    approveEntry.mockReset();
    requireApiUser.mockResolvedValue({
      id: "user_1",
      organizationId: "org_1",
      role: "APPROVER"
    });
    enforceStateChangingRequest.mockResolvedValue(undefined);
    getRequestMeta.mockReturnValue({ ip: "127.0.0.1", userAgent: "vitest" });
  });

  it("approves an entry through the route handler", async () => {
    approveEntry.mockResolvedValue({
      id: "entry_1",
      status: "APPROVED"
    });

    const { POST } = await import("@/app/api/entries/[id]/approve/route");
    const request = new NextRequest("http://localhost:3000/api/entries/entry_1/approve", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        note: "Approved after review"
      })
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "entry_1" })
    });

    expect(response.status).toBe(200);
    expect(approveEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org_1",
        userId: "user_1"
      }),
      "entry_1",
      "Approved after review"
    );
  });
});
