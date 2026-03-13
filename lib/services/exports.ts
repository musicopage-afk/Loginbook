import { stringify } from "csv-stringify/sync";
import { AuditAction, EntityType } from "@prisma/client";
import { createAuditEvent } from "@/lib/audit";
import { listAuditEvents } from "@/lib/services/audit";
import { listEntries } from "@/lib/services/entries";
import { buildEntryWhere } from "@/lib/queries";

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
      title: entry.title,
      body: entry.body,
      status: entry.status,
      occurredAt: entry.occurredAt.toISOString(),
      createdBy: entry.createdByUser.displayName,
      tags: entry.tags.map((tag) => tag.tag.name).join("|")
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
      entityId: event.entityId,
      userId: event.userId,
      occurredAt: event.occurredAt.toISOString(),
      ip: event.ip,
      userAgent: event.userAgent
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
