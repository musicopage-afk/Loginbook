import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { ApiError, enforceStateChangingRequest, getRequestMeta, jsonError, jsonOk, requireApiUser } from "@/lib/api";
import { getEntry, updateEntry, deleteEntry } from "@/lib/services/entries";
import { createEntrySchema, validateEntryPayloadByDirection } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiUser(UserRole.READER);
    const { id } = await params;
    const entry = await getEntry(id, user.organizationId);
    if (!entry) {
      throw new ApiError(404, "Entry not found");
    }
    return jsonOk({ entry });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiUser(UserRole.EDITOR);
    await enforceStateChangingRequest(request);
    const { id } = await params;
    const body = validateEntryPayloadByDirection(createEntrySchema.parse(await request.json()));
    const meta = getRequestMeta(request);
    const entry = await updateEntry(
      {
        organizationId: user.organizationId,
        userId: user.id,
        role: user.role,
        ip: meta.ip,
        userAgent: meta.userAgent
      },
      id,
      body
    );
    return jsonOk({ entry });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiUser(UserRole.EDITOR);
    await enforceStateChangingRequest(request);
    const { id } = await params;
    const meta = getRequestMeta(request);
    const entry = await deleteEntry({
      organizationId: user.organizationId,
      userId: user.id,
      role: user.role,
      ip: meta.ip,
      userAgent: meta.userAgent
    }, id);
    return jsonOk({ entry });
  } catch (error) {
    return jsonError(error);
  }
}
