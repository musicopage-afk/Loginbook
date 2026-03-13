import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireApiUser, getRequestMeta, jsonError } from "@/lib/api";
import { exportLogbookCsv } from "@/lib/services/exports";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiUser(UserRole.READER);
    const { id } = await params;
    const meta = getRequestMeta(request);
    const csv = await exportLogbookCsv({
      organizationId: user.organizationId,
      logbookId: id,
      userId: user.id,
      ip: meta.ip,
      userAgent: meta.userAgent
    });

    return new NextResponse(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="logbook-${id}.csv"`
      }
    });
  } catch (error) {
    return jsonError(error);
  }
}
