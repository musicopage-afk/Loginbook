import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";
import { getClientIp, getUserAgent, validateOrigin, validateSignedCsrf } from "@/lib/security";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function requireApiUser(minimumRole?: UserRole) {
  const session = await getCurrentSession();
  if (!session) {
    throw new ApiError(401, "Unauthorized");
  }

  if (minimumRole && !hasRole(session.user.role, minimumRole)) {
    throw new ApiError(403, "Forbidden");
  }

  return session.user;
}

export async function enforceStateChangingRequest(request: NextRequest) {
  const csrfHeader = request.headers.get("x-csrf-token");
  const cookieToken = request.cookies.get("loginbook_csrf")?.value;
  if (!validateOrigin(request) || !validateSignedCsrf(csrfHeader) || csrfHeader !== cookieToken) {
    throw new ApiError(403, "CSRF validation failed");
  }
}

export function jsonOk(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : "Internal server error";
  return NextResponse.json({ error: message }, { status: 500 });
}

export function getRequestMeta(request: NextRequest) {
  return {
    ip: getClientIp(request),
    userAgent: getUserAgent(request)
  };
}
