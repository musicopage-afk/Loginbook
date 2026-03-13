import { AuditAction, EntityType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sanitizeObject } from "@/lib/sanitize";

type AuditInput = {
  tx?: Prisma.TransactionClient;
  organizationId: string;
  userId?: string | null;
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  beforeJson?: Prisma.InputJsonValue | null;
  afterJson?: Prisma.InputJsonValue | null;
  ip?: string | null;
  userAgent?: string | null;
  occurredAt?: Date;
};

export async function createAuditEvent(input: AuditInput) {
  const client = "tx" in input && input.tx ? input.tx : prisma;
  return client.auditEvent.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      beforeJson: input.beforeJson ? sanitizeObject(input.beforeJson) : Prisma.JsonNull,
      afterJson: input.afterJson ? sanitizeObject(input.afterJson) : Prisma.JsonNull,
      ip: input.ip ?? null,
      userAgent: input.userAgent ? sanitizeObject(input.userAgent) : null,
      occurredAt: input.occurredAt ?? new Date()
    }
  });
}
