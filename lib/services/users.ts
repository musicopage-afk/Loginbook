import { AuditAction, EntityType, UserRole, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit";
import { ApiError } from "@/lib/api";
import { hashPassword } from "@/lib/auth";
import { canManageAccounts } from "@/lib/rbac";
import { sanitizeObject } from "@/lib/sanitize";

const DELETED_ACCOUNT_PREFIX = "deleted-account::";

type UserMutationContext = {
  organizationId: string;
  userId: string;
  role: UserRole;
  ip?: string | null;
  userAgent?: string | null;
};

export async function listUsers(organizationId: string) {
  return prisma.user.findMany({
    where: {
      organizationId,
      email: {
        not: {
          startsWith: DELETED_ACCOUNT_PREFIX
        }
      }
    },
    orderBy: [
      { status: "asc" },
      { email: "asc" }
    ]
  });
}

export async function createUser(
  context: UserMutationContext,
  input: {
    username: string;
    password: string;
    role: UserRole;
  }
) {
  if (!canManageAccounts(context.role)) {
    throw new ApiError(403, "Only administrators can manage accounts");
  }

  const username = input.username.trim().toLowerCase();
  const existing = await prisma.user.findFirst({
    where: {
      organizationId: context.organizationId,
      email: username
    }
  });

  if (existing) {
    throw new ApiError(409, "Username is already in use");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      organizationId: context.organizationId,
      email: username,
      displayName: `${input.role} User`,
      passwordHash,
      role: input.role,
      status: UserStatus.ACTIVE
    }
  });

  await createAuditEvent({
    organizationId: context.organizationId,
    userId: context.userId,
    action: AuditAction.CREATE,
    entityType: EntityType.USER,
    entityId: user.id,
    afterJson: sanitizeObject(user),
    ip: context.ip,
    userAgent: context.userAgent
  });

  return user;
}

export async function updateUserStatus(
  context: UserMutationContext,
  targetUserId: string,
  status: UserStatus
) {
  if (!canManageAccounts(context.role)) {
    throw new ApiError(403, "Only administrators can manage accounts");
  }

  if (context.userId === targetUserId) {
    throw new ApiError(409, "You cannot manage your own account");
  }

  const existing = await prisma.user.findFirst({
    where: {
      id: targetUserId,
      organizationId: context.organizationId
    }
  });

  if (!existing) {
    throw new ApiError(404, "Account not found");
  }

  const updated = await prisma.user.update({
    where: {
      id: targetUserId
    },
    data: {
      status
    }
  });

  await createAuditEvent({
    organizationId: context.organizationId,
    userId: context.userId,
    action: AuditAction.UPDATE,
    entityType: EntityType.USER,
    entityId: updated.id,
    beforeJson: sanitizeObject(existing),
    afterJson: sanitizeObject(updated),
    ip: context.ip,
    userAgent: context.userAgent
  });

  return updated;
}

export async function updateUserCredentials(
  context: UserMutationContext,
  targetUserId: string,
  input: {
    username: string;
    password?: string;
    role: UserRole;
  }
) {
  if (!canManageAccounts(context.role)) {
    throw new ApiError(403, "Only administrators can manage accounts");
  }

  const existing = await prisma.user.findFirst({
    where: {
      id: targetUserId,
      organizationId: context.organizationId
    }
  });

  if (!existing) {
    throw new ApiError(404, "Account not found");
  }

  const username = input.username.trim().toLowerCase();
  const duplicate = await prisma.user.findFirst({
    where: {
      organizationId: context.organizationId,
      email: username,
      id: {
        not: targetUserId
      }
    }
  });

  if (duplicate) {
    throw new ApiError(409, "Username is already in use");
  }

  const updated = await prisma.user.update({
    where: {
      id: targetUserId
    },
    data: {
      email: username,
      role: input.role,
      displayName: `${input.role} User`,
      ...(input.password ? { passwordHash: await hashPassword(input.password) } : {})
    }
  });

  await createAuditEvent({
    organizationId: context.organizationId,
    userId: context.userId,
    action: AuditAction.UPDATE,
    entityType: EntityType.USER,
    entityId: updated.id,
    beforeJson: sanitizeObject(existing),
    afterJson: sanitizeObject(updated),
    ip: context.ip,
    userAgent: context.userAgent
  });

  return updated;
}

export async function deleteUser(context: UserMutationContext, targetUserId: string) {
  if (!canManageAccounts(context.role)) {
    throw new ApiError(403, "Only administrators can manage accounts");
  }

  if (context.userId === targetUserId) {
    throw new ApiError(409, "You cannot delete your own account");
  }

  const existing = await prisma.user.findFirst({
    where: {
      id: targetUserId,
      organizationId: context.organizationId
    }
  });

  if (!existing) {
    throw new ApiError(404, "Account not found");
  }

  await prisma.session.deleteMany({
    where: {
      userId: targetUserId
    }
  });

  const deleted = await prisma.user.update({
    where: {
      id: targetUserId
    },
    data: {
      email: `${DELETED_ACCOUNT_PREFIX}${existing.id}`,
      displayName: "Deleted Account",
      status: UserStatus.DISABLED
    }
  });

  await createAuditEvent({
    organizationId: context.organizationId,
    userId: context.userId,
    action: AuditAction.DELETE,
    entityType: EntityType.USER,
    entityId: deleted.id,
    beforeJson: sanitizeObject(existing),
    afterJson: sanitizeObject(deleted),
    ip: context.ip,
    userAgent: context.userAgent
  });

  return deleted;
}
