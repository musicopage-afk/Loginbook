import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireApiUser, getRequestMeta, jsonError } from "@/lib/api";
import { exportAuditCsv } from "@/lib/services/exports";

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(UserRole.AUDITOR);
    const meta = getRequestMeta(request);
    const csv = await exportAuditCsv({
      organizationId: user.organizationId,
      userId: user.id,
      ip: meta.ip,
      userAgent: meta.userAgent
    });

    return new NextResponse(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=\"audit-events.csv\""
      }
    });
  } catch (error) {
    return jsonError(error);
  }
}
