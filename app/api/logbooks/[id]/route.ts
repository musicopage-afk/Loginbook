import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { enforceStateChangingRequest, getRequestMeta, jsonError, jsonOk, requireApiUser } from "@/lib/api";
import { deleteLogbook } from "@/lib/services/logbooks";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiUser(UserRole.ADMIN);
    await enforceStateChangingRequest(request);
    const { id } = await params;
    const meta = getRequestMeta(request);
    const logbook = await deleteLogbook({
      organizationId: user.organizationId,
      userId: user.id,
      role: user.role,
      logbookId: id,
      ip: meta.ip,
      userAgent: meta.userAgent
    });

    return jsonOk({ logbook });
  } catch (error) {
    return jsonError(error);
  }
}
