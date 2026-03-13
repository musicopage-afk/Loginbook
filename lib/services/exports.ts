import { stringify } from "csv-stringify/sync";
import { AuditAction, EntityType } from "@prisma/client";
import { createAuditEvent } from "@/lib/audit";
import { listAuditEvents } from "@/lib/services/audit";
import { listEntries } from "@/lib/services/entries";
import { buildEntryWhere } from "@/lib/queries";

function escapeCsvFormula(value: string | null | undefined) {
  const normalized = String(value ?? "");
  return /^[=+\-@]/.test(normalized) ? `'${normalized}` : normalized;
}

export async function exportLogbookCsv(input: {
  organizationId: string;
  logbookId: string;
  userId: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const entries = await listEntries(buildEntryWhere(input.organizationId, input.logbookId, {}));
  const csv = stringify(
    entries.map((entry) => ({
      id: entry.id,
      title: escapeCsvFormula(entry.title),
      body: escapeCsvFormula(entry.body),
      status: entry.status,
      occurredAt: entry.occurredAt.toISOString(),
      createdBy: escapeCsvFormula(entry.createdByUser.displayName),
      tags: escapeCsvFormula(entry.tags.map((tag) => tag.tag.name).join("|"))
    })),
    { header: true }
  );

  await createAuditEvent({
    organizationId: input.organizationId,
    userId: input.userId,
    action: AuditAction.EXPORT,
    entityType: EntityType.LOGBOOK,
    entityId: input.logbookId,
    afterJson: { format: "csv" },
    ip: input.ip,
    userAgent: input.userAgent
  });

  return csv;
}

export async function exportAuditCsv(input: {
  organizationId: string;
  userId: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const events = await listAuditEvents(input.organizationId, {});
  const csv = stringify(
    events.map((event) => ({
      id: event.id,
      action: event.action,
      entityType: event.entityType,
      entityId: escapeCsvFormula(event.entityId),
      userId: escapeCsvFormula(event.userId),
      occurredAt: event.occurredAt.toISOString(),
      ip: escapeCsvFormula(event.ip),
      userAgent: escapeCsvFormula(event.userAgent)
    })),
    { header: true }
  );

  await createAuditEvent({
    organizationId: input.organizationId,
    userId: input.userId,
    action: AuditAction.EXPORT,
    entityType: EntityType.AUDIT_EVENT,
    entityId: input.organizationId,
    afterJson: { format: "csv" },
    ip: input.ip,
    userAgent: input.userAgent
  });

  return csv;
}
