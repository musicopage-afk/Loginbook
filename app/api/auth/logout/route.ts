import { AuditAction, EntityType } from "@prisma/client";
import { NextRequest } from "next/server";
import { getCurrentSession, revokeSessionByToken } from "@/lib/auth";
import { createAuditEvent } from "@/lib/audit";
import { enforceStateChangingRequest, getRequestMeta, jsonError, jsonOk } from "@/lib/api";
import { getRequestSessionToken, issueCsrfToken } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    await enforceStateChangingRequest(request);
    const session = await getCurrentSession();
    const token = await getRequestSessionToken();

    if (token) {
      await revokeSessionByToken(token);
    }

    await issueCsrfToken();

    if (session) {
      const meta = getRequestMeta(request);
      await createAuditEvent({
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: AuditAction.LOGOUT,
        entityType: EntityType.SESSION,
        entityId: session.id,
        ip: meta.ip,
        userAgent: meta.userAgent
      });
    }

    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
