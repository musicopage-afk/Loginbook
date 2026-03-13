import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { enforceStateChangingRequest, getRequestMeta, jsonError, jsonOk, requireApiUser } from "@/lib/api";
import { listLogbooks, createLogbook } from "@/lib/services/logbooks";
import { createLogbookSchema } from "@/lib/validation";

export async function GET() {
  try {
    const user = await requireApiUser(UserRole.READER);
    const logbooks = await listLogbooks(user.organizationId);
    return jsonOk({ logbooks });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(UserRole.ADMIN);
    await enforceStateChangingRequest(request);
    const body = createLogbookSchema.parse(await request.json());
    const meta = getRequestMeta(request);
    const logbook = await createLogbook({
      organizationId: user.organizationId,
      userId: user.id,
      role: user.role,
      name: body.name,
      type: body.type,
      ip: meta.ip,
      userAgent: meta.userAgent
    });
    return jsonOk({ logbook }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
