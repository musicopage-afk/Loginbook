import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { jsonError, jsonOk, requireApiUser } from "@/lib/api";
import { listAuditEvents } from "@/lib/services/audit";
import { auditFilterSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(UserRole.AUDITOR);
    const filters = auditFilterSchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
    const events = await listAuditEvents(user.organizationId, filters);
    return jsonOk({ events });
  } catch (error) {
    return jsonError(error);
  }
}
