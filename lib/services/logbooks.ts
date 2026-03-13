import { AuditAction, EntityType, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit";
import { ApiError } from "@/lib/api";
import { canCreateLogbook } from "@/lib/rbac";
import { sanitizeObject } from "@/lib/sanitize";

export async function listLogbooks(organizationId: string) {
  return prisma.logbook.findMany({
    where: {
      organizationId,
      deletedAt: null
    },
    orderBy: {
      createdAt: "desc"
    }
  });
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
