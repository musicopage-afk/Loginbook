import type { Prisma } from "@prisma/client";

export type LogDirection = "ENTRY" | "EXIT";
export type LogLifecycle = "active" | "past" | "inactive";

type EntryLike = {
  title: string;
  body: string;
  createdAt: Date;
  occurredAt: Date;
  structuredFieldsJson: Prisma.JsonValue | null;
};

function getStructuredFields(value: Prisma.JsonValue | null): Record<string, unknown> {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return {};
  }

  return value as Record<string, unknown>;
}

export function formatGmtTimestamp(value: Date) {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(value);

  return `${formatted.replace(",", "")} GMT`;
}

export function getLogFields(entry: EntryLike) {
  const structured = getStructuredFields(entry.structuredFieldsJson);
  const entryOrExit: LogDirection = structured.entryOrExit === "EXIT" ? "EXIT" : "ENTRY";
  const authorisedBy =
    typeof structured.authorisedBy === "string" && structured.authorisedBy.trim()
      ? structured.authorisedBy
      : "Not provided";

  return {
    name: entry.title,
    entryOrExit,
    reason: entry.body,
    authorisedBy,
    timestamp: formatGmtTimestamp(entry.createdAt),
    occurredAtIso: entry.occurredAt.toISOString()
  };
}

export function getLifecycleSortOrder(lifecycle: LogLifecycle) {
  switch (lifecycle) {
    case "active":
      return 0;
    case "past":
      return 1;
    case "inactive":
      return 2;
  }
}
