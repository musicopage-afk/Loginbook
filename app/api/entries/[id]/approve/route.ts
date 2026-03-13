import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { approveEntry } from "@/lib/services/entries";
import { approveEntrySchema } from "@/lib/validation";
import { enforceStateChangingRequest, getRequestMeta, jsonError, jsonOk, requireApiUser } from "@/lib/api";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiUser(UserRole.APPROVER);
    await enforceStateChangingRequest(request);
    const { id } = await params;
    const body = approveEntrySchema.parse(await request.json());
    const meta = getRequestMeta(request);
    const entry = await approveEntry({
      organizationId: user.organizationId,
      userId: user.id,
      role: user.role,
      ip: meta.ip,
      userAgent: meta.userAgent
    }, id, body.note);
    return jsonOk({ entry });
  } catch (error) {
    return jsonError(error);
  }
}
