import { describe, expect, it } from "vitest";
import { sanitizeAuditText, sanitizeObject } from "@/lib/sanitize";

describe("sanitize helpers", () => {
  it("removes control characters from auditable strings", () => {
    expect(sanitizeAuditText("hello\nworld\t")).toBe("hello world");
  });

  it("sanitizes nested objects and dates", () => {
    const sanitized = sanitizeObject({
      title: "line\r\nbreak",
      nested: ["a\tb", { when: new Date("2026-03-13T10:00:00.000Z") }]
    });

    expect(sanitized).toEqual({
      title: "line  break",
      nested: ["a b", { when: "2026-03-13T10:00:00.000Z" }]
    });
  });
});
