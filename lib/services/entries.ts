import { AuditAction, EntityType, EntryStatus, Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit";
import { ApiError } from "@/lib/api";
import { canApproveEntry, canCreateEntry, canEditEntry } from "@/lib/rbac";
import { sanitizeObject } from "@/lib/sanitize";
import { getStorageAdapter } from "@/lib/storage";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";

type EntryMutationContext = {
  organizationId: string;
  userId: string;
  role: UserRole;
  ip?: string | null;
  userAgent?: string | null;
};

async function ensureTags(organizationId: string, names: string[], tx: Prisma.TransactionClient) {
  const uniqueNames = [...new Set(names.map((name) => name.trim().toLowerCase()).filter(Boolean))];

  for (const name of uniqueNames) {
    await tx.tag.upsert({
      where: {
        organizationId_name: {
          organizationId,
          name
        }
      },
      update: {},
      create: {
        organizationId,
        name
      }
    });
  }

  return tx.tag.findMany({
    where: {
      organizationId,
      name: {
        in: uniqueNames
      }
    }
  });
}

export async function listEntries(where: Prisma.EntryWhereInput) {
  return prisma.entry.findMany({
    where,
    include: {
      createdByUser: true,
      approvedByUser: true,
      tags: {
        include: {
          tag: true
        }
      },
      attachments: true
    },
    orderBy: {
      occurredAt: "desc"
    }
  });
}

export async function getEntry(entryId: string, organizationId: string) {
  return prisma.entry.findFirst({
    where: {
      id: entryId,
      logbook: {
        organizationId
      }
    },
    include: {
      createdByUser: true,
      approvedByUser: true,
      tags: {
        include: {
          tag: true
        }
      },
      attachments: true,
      supersedesEntry: true,
      supersededByEntries: true
    }
  });
}

export async function createEntry(
  context: EntryMutationContext,
  input: {
    logbookId: string;
    title: string;
    body: string;
    occurredAt: string;
    tags: string[];
    structuredFieldsJson: Record<string, unknown>;
    supersedesEntryId?: string;
    files?: File[];
  }
) {
  if (!canCreateEntry(context.role)) {
    throw new ApiError(403, "Insufficient role to create entries");
  }

  return prisma.$transaction(async (tx) => {
    if (input.supersedesEntryId) {
      const prior = await tx.entry.findUnique({
        where: { id: input.supersedesEntryId }
      });

      if (!prior || prior.status !== EntryStatus.APPROVED) {
        throw new ApiError(409, "Only approved entries can be superseded");
      }

      await tx.entry.update({
        where: { id: prior.id },
        data: {
          status: EntryStatus.SUPERSEDED
        }
      });

      await createAuditEvent({
        tx,
        organizationId: context.organizationId,
        userId: context.userId,
        action: AuditAction.SUPERSEDE,
        entityType: EntityType.ENTRY,
        entityId: prior.id,
        beforeJson: sanitizeObject(prior),
        afterJson: sanitizeObject({ ...prior, status: EntryStatus.SUPERSEDED }),
        ip: context.ip,
        userAgent: context.userAgent
      });
    }

    const entry = await tx.entry.create({
      data: {
        logbookId: input.logbookId,
        createdByUserId: context.userId,
        title: input.title,
        body: input.body,
        occurredAt: new Date(input.occurredAt),
        structuredFieldsJson: sanitizeObject(input.structuredFieldsJson) as Prisma.InputJsonValue,
        status: EntryStatus.SUBMITTED,
        supersedesEntryId: input.supersedesEntryId
      }
    });

    const tags = await ensureTags(context.organizationId, input.tags, tx);
    if (tags.length > 0) {
      await tx.entryTag.createMany({
        data: tags.map((tag) => ({
          entryId: entry.id,
          tagId: tag.id
        })),
        skipDuplicates: true
      });
    }

    const files = input.files ?? [];
    const storage = getStorageAdapter();
    for (const file of files) {
      if (file.size > MAX_UPLOAD_BYTES) {
        throw new ApiError(413, "Attachment exceeds 20MB limit");
      }

      const stored = await storage.save(file, entry.id);
      const attachment = await tx.attachment.create({
        data: {
          entryId: entry.id,
          filename: stored.filename,
          contentType: stored.contentType,
          byteSize: stored.byteSize,
          sha256: stored.sha256,
          storageUri: stored.storageUri
        }
      });

      await createAuditEvent({
        tx,
        organizationId: context.organizationId,
        userId: context.userId,
        action: AuditAction.UPLOAD,
        entityType: EntityType.ATTACHMENT,
        entityId: attachment.id,
        afterJson: sanitizeObject(attachment),
        ip: context.ip,
        userAgent: context.userAgent
      });
    }

    await createAuditEvent({
      tx,
      organizationId: context.organizationId,
      userId: context.userId,
      action: AuditAction.CREATE,
      entityType: EntityType.ENTRY,
      entityId: entry.id,
      afterJson: sanitizeObject(entry),
      ip: context.ip,
      userAgent: context.userAgent
    });

    return entry;
  });
}

export async function updateEntry(
  context: EntryMutationContext,
  entryId: string,
  input: {
    title: string;
    body: string;
    occurredAt: string;
    tags: string[];
    structuredFieldsJson: Record<string, unknown>;
  }
) {
  if (!canEditEntry(context.role)) {
    throw new ApiError(403, "Insufficient role to edit entries");
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.entry.findUnique({
      where: { id: entryId },
      include: {
        logbook: true
      }
    });

    if (!existing || existing.logbook.organizationId !== context.organizationId) {
      throw new ApiError(404, "Entry not found");
    }

    if (existing.status === EntryStatus.APPROVED) {
      throw new ApiError(409, "Approved entries are locked. Create a superseding entry instead.");
    }

    const updated = await tx.entry.update({
      where: { id: entryId },
      data: {
        title: input.title,
        body: input.body,
        occurredAt: new Date(input.occurredAt),
        structuredFieldsJson: sanitizeObject(input.structuredFieldsJson) as Prisma.InputJsonValue
      }
    });

    await tx.entryTag.deleteMany({
      where: {
        entryId
      }
    });

    const tags = await ensureTags(context.organizationId, input.tags, tx);
    if (tags.length > 0) {
      await tx.entryTag.createMany({
        data: tags.map((tag) => ({
          entryId,
          tagId: tag.id
        }))
      });
    }

    await createAuditEvent({
      tx,
      organizationId: context.organizationId,
      userId: context.userId,
      action: AuditAction.UPDATE,
      entityType: EntityType.ENTRY,
      entityId: updated.id,
      beforeJson: sanitizeObject(existing),
      afterJson: sanitizeObject(updated),
      ip: context.ip,
      userAgent: context.userAgent
    });

    return updated;
  });
}

export async function deleteEntry(context: EntryMutationContext, entryId: string) {
  if (!canEditEntry(context.role)) {
    throw new ApiError(403, "Insufficient role to delete entries");
  }

  const existing = await prisma.entry.findFirst({
    where: {
      id: entryId,
      logbook: {
        organizationId: context.organizationId
      }
    }
  });

  if (!existing) {
    throw new ApiError(404, "Entry not found");
  }

  const deleted = await prisma.entry.update({
    where: {
      id: entryId
    },
    data: {
      status: EntryStatus.DELETED,
      deletedAt: new Date()
    }
  });

  await createAuditEvent({
    organizationId: context.organizationId,
    userId: context.userId,
    action: AuditAction.DELETE,
    entityType: EntityType.ENTRY,
    entityId: entryId,
    beforeJson: sanitizeObject(existing),
    afterJson: sanitizeObject(deleted),
    ip: context.ip,
    userAgent: context.userAgent
  });

  return deleted;
}

export async function approveEntry(context: EntryMutationContext, entryId: string, note?: string) {
  if (!canApproveEntry(context.role)) {
    throw new ApiError(403, "Insufficient role to approve entries");
  }

  const existing = await prisma.entry.findFirst({
    where: {
      id: entryId,
      logbook: {
        organizationId: context.organizationId
      }
    }
  });

  if (!existing) {
    throw new ApiError(404, "Entry not found");
  }

  if (existing.status === EntryStatus.APPROVED) {
    throw new ApiError(409, "Entry already approved");
  }

  const approved = await prisma.entry.update({
    where: { id: entryId },
    data: {
      status: EntryStatus.APPROVED,
      approvedAt: new Date(),
      approvedByUserId: context.userId
    }
  });

  await createAuditEvent({
    organizationId: context.organizationId,
    userId: context.userId,
    action: AuditAction.APPROVE,
    entityType: EntityType.ENTRY,
    entityId: entryId,
    beforeJson: sanitizeObject(existing),
    afterJson: sanitizeObject({ ...approved, approvalNote: note ?? null }),
    ip: context.ip,
    userAgent: context.userAgent
  });

  return approved;
}
