import { Prisma } from "@prisma/client";

export function buildEntryWhere(
  organizationId: string,
  logbookId: string,
  filters: {
    from?: string;
    to?: string;
    tag?: string;
    author?: string;
    status?: string;
    q?: string;
  }
): Prisma.EntryWhereInput {
  return {
    logbookId,
    deletedAt: null,
    logbook: {
      organizationId
    },
    occurredAt:
      filters.from || filters.to
        ? {
            gte: filters.from ? new Date(filters.from) : undefined,
            lte: filters.to ? new Date(filters.to) : undefined
          }
        : undefined,
    createdByUserId: filters.author || undefined,
    status: filters.status as never,
    tags: filters.tag
      ? {
          some: {
            tag: {
              name: filters.tag
            }
          }
        }
      : undefined,
    OR: filters.q
      ? [
          { title: { contains: filters.q, mode: "insensitive" } },
          { body: { contains: filters.q, mode: "insensitive" } }
        ]
      : undefined
  };
}

export function buildAuditWhere(
  organizationId: string,
  filters: {
    userId?: string;
    action?: string;
    entityType?: string;
    from?: string;
    to?: string;
  }
): Prisma.AuditEventWhereInput {
  return {
    organizationId,
    userId: filters.userId,
    action: filters.action as never,
    entityType: filters.entityType as never,
    occurredAt:
      filters.from || filters.to
        ? {
            gte: filters.from ? new Date(filters.from) : undefined,
            lte: filters.to ? new Date(filters.to) : undefined
          }
        : undefined
  };
}
