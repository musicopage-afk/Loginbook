import { prisma } from "@/lib/prisma";
import { buildAuditWhere } from "@/lib/queries";

export async function listAuditEvents(
  organizationId: string,
  filters: {
    userId?: string;
    action?: string;
    entityType?: string;
    from?: string;
    to?: string;
  }
) {
  return prisma.auditEvent.findMany({
    where: buildAuditWhere(organizationId, filters),
    include: {
      user: true
    },
    orderBy: {
      occurredAt: "desc"
    }
  });
}
