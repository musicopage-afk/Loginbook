import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { getClientIp, getUserAgent, sha256, validateOrigin, validateSignedCsrf } from "@/lib/security";

describe("security helpers", () => {
  it("hashes values with sha256", () => {
    expect(sha256("loginbook")).toBe(createHash("sha256").update("loginbook").digest("hex"));
  });

  it("validates signed csrf tokens", () => {
    const raw = "csrf-token";
    const signature = createHash("sha256")
      .update("csrf-token:test-csrf-secret-32-bytes-minimum")
      .digest("hex");

    expect(validateSignedCsrf(`${raw}.${signature}`)).toBe(true);
    expect(validateSignedCsrf(`${raw}.bad-signature`)).toBe(false);
    expect(validateSignedCsrf(null)).toBe(false);
  });

  it("validates request origin and extracts client metadata", () => {
    const request = new NextRequest("http://localhost:3000/api/logbooks", {
      headers: {
        origin: "http://localhost:3000",
        "x-forwarded-for": "203.0.113.10, 10.0.0.1",
        "user-agent": "vitest-agent"
      }
    });

    expect(validateOrigin(request)).toBe(true);
    expect(getClientIp(request)).toBe("203.0.113.10");
    expect(getUserAgent(request)).toBe("vitest-agent");
  });
});
