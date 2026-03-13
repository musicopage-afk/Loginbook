import { AuditAction, EntityType, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit";
import { ApiError } from "@/lib/api";
import { DEFAULT_LOGBOOK_NAME, DEFAULT_LOGBOOK_TYPE } from "@/lib/constants";
import { canCreateLogbook } from "@/lib/rbac";
import { sanitizeObject } from "@/lib/sanitize";

export async function listLogbooks(organizationId: string) {
  const logbook = await prisma.logbook.findFirst({
    where: {
      organizationId,
      deletedAt: null,
      name: DEFAULT_LOGBOOK_NAME
    }
  });

  if (logbook) {
    return [logbook];
  }

  const created = await prisma.logbook.create({
    data: {
      organizationId,
      name: DEFAULT_LOGBOOK_NAME,
      type: DEFAULT_LOGBOOK_TYPE
    }
  });

  return [created];
}

export async function createLogbook(input: {
  organizationId: string;
  userId: string;
  role: UserRole;
  name: string;
  type: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  if (!canCreateLogbook(input.role)) {
    throw new ApiError(403, "Only administrators can create logbooks");
  }

  const logbook = await prisma.logbook.create({
    data: {
      organizationId: input.organizationId,
      name: input.name,
      type: input.type
    }
  });

  await createAuditEvent({
    organizationId: input.organizationId,
    userId: input.userId,
    action: AuditAction.CREATE,
    entityType: EntityType.LOGBOOK,
    entityId: logbook.id,
    afterJson: sanitizeObject(logbook),
    ip: input.ip,
    userAgent: input.userAgent
  });

  return logbook;
}

export async function deleteLogbook(input: {
  organizationId: string;
  userId: string;
  role: UserRole;
  logbookId: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  if (!canCreateLogbook(input.role)) {
    throw new ApiError(403, "Only administrators can delete logbooks");
  }

  const existing = await prisma.logbook.findFirst({
    where: {
      id: input.logbookId,
      organizationId: input.organizationId,
      deletedAt: null
    }
  });

  if (!existing) {
    throw new ApiError(404, "Logbook not found");
  }

  const deleted = await prisma.logbook.update({
    where: {
      id: input.logbookId
    },
    data: {
      deletedAt: new Date()
    }
  });

  await createAuditEvent({
    organizationId: input.organizationId,
    userId: input.userId,
    action: AuditAction.DELETE,
    entityType: EntityType.LOGBOOK,
    entityId: input.logbookId,
    beforeJson: sanitizeObject(existing),
    afterJson: sanitizeObject(deleted),
    ip: input.ip,
    userAgent: input.userAgent
  });

  return deleted;
}
