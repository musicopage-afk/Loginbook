import { Prisma } from "@prisma/client";

function normalizeFilter(value?: string) {
  return value && value.trim() ? value : undefined;
}

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
  const author = normalizeFilter(filters.author);
  const status = normalizeFilter(filters.status);
  const tag = normalizeFilter(filters.tag);
  const query = normalizeFilter(filters.q);

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
    createdByUserId: author,
    status: status as never,
    tags: tag
      ? {
          some: {
            tag: {
              name: tag
            }
          }
        }
      : undefined,
    OR: query
      ? [
          { title: { contains: query } },
          { body: { contains: query } }
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
  const userId = normalizeFilter(filters.userId);
  const action = normalizeFilter(filters.action);
  const entityType = normalizeFilter(filters.entityType);

  return {
    organizationId,
    userId,
    action: action as never,
    entityType: entityType as never,
    occurredAt:
      filters.from || filters.to
        ? {
            gte: filters.from ? new Date(filters.from) : undefined,
            lte: filters.to ? new Date(filters.to) : undefined
          }
        : undefined
  };
}
