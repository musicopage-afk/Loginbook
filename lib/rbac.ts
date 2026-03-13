import { UserRole } from "@prisma/client";

const roleRank: Record<UserRole, number> = {
  READER: 1,
  CONTRIBUTOR: 2,
  EDITOR: 3,
  APPROVER: 4,
  AUDITOR: 5,
  ADMIN: 6
};

export function hasRole(userRole: UserRole, minimumRole: UserRole) {
  return roleRank[userRole] >= roleRank[minimumRole];
}

export function canCreateEntry(role: UserRole) {
  return hasRole(role, UserRole.CONTRIBUTOR);
}

export function canEditEntry(role: UserRole) {
  return hasRole(role, UserRole.EDITOR);
}

export function canApproveEntry(role: UserRole) {
  return hasRole(role, UserRole.APPROVER);
}

export function canViewAudit(role: UserRole) {
  return role === UserRole.AUDITOR || role === UserRole.ADMIN;
}

export function canCreateLogbook(role: UserRole) {
  return role === UserRole.ADMIN;
}

export function canExportAudit(role: UserRole) {
  return canViewAudit(role);
}
