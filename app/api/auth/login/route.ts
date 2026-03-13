import { AuditAction, EntityType } from "@prisma/client";
import { NextRequest } from "next/server";
import { authenticate, createSession, revokeSessionByToken } from "@/lib/auth";
import { createAuditEvent } from "@/lib/audit";
import { ApiError, enforceStateChangingRequest, getRequestMeta, jsonError, jsonOk } from "@/lib/api";
import { assertRateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";
import { getRequestSessionToken, issueCsrfToken } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    await enforceStateChangingRequest(request);
    const body = loginSchema.parse(await request.json());
    await assertRateLimit(`login:${body.username}:${request.headers.get("x-forwarded-for") ?? "local"}`);

    const authResult = await authenticate(body.username, body.password);
    if (!authResult.ok) {
      throw new ApiError(401, "Invalid username or password");
    }
    const user = authResult.user;

    const existingToken = await getRequestSessionToken();
    if (existingToken) {
      await revokeSessionByToken(existingToken);
    }

    const { session } = await createSession(user.id);
    await issueCsrfToken();

    const meta = getRequestMeta(request);
    await createAuditEvent({
      organizationId: user.organizationId,
      userId: user.id,
      action: AuditAction.LOGIN,
      entityType: EntityType.SESSION,
      entityId: session.id,
      afterJson: { sessionId: session.id },
      ip: meta.ip,
      userAgent: meta.userAgent
    });

    return jsonOk({
      user: {
        id: user.id,
        username: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return jsonError(error);
  }
}
