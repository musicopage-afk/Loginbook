import { UserStatus, UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { enforceStateChangingRequest, getRequestMeta, jsonError, jsonOk, requireApiUser } from "@/lib/api";
import { deleteUser, updateUserCredentials, updateUserStatus } from "@/lib/services/users";
import { updateUserCredentialsSchema, updateUserStatusSchema } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiUser(UserRole.ADMIN);
    await enforceStateChangingRequest(request);
    const { id } = await params;
    const body = updateUserStatusSchema.parse(await request.json());
    const meta = getRequestMeta(request);
    const updated = await updateUserStatus(
      {
        organizationId: user.organizationId,
        userId: user.id,
        role: user.role,
        ip: meta.ip,
        userAgent: meta.userAgent
      },
      id,
      body.status as UserStatus
    );

    return jsonOk({
      user: {
        id: updated.id,
        username: updated.email,
        role: updated.role,
        status: updated.status
      }
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiUser(UserRole.ADMIN);
    await enforceStateChangingRequest(request);
    const { id } = await params;
    const body = updateUserCredentialsSchema.parse(await request.json());
    const meta = getRequestMeta(request);
    const updated = await updateUserCredentials(
      {
        organizationId: user.organizationId,
        userId: user.id,
        role: user.role,
        ip: meta.ip,
        userAgent: meta.userAgent
      },
      id,
      {
        username: body.username,
        password: body.password,
        role: body.role as UserRole
      }
    );

    return jsonOk({
      user: {
        id: updated.id,
        username: updated.email,
        role: updated.role,
        status: updated.status
      }
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiUser(UserRole.ADMIN);
    await enforceStateChangingRequest(request);
    const { id } = await params;
    const meta = getRequestMeta(request);
    const deleted = await deleteUser(
      {
        organizationId: user.organizationId,
        userId: user.id,
        role: user.role,
        ip: meta.ip,
        userAgent: meta.userAgent
      },
      id
    );

    return jsonOk({
      user: {
        id: deleted.id,
        username: deleted.email
      }
    });
  } catch (error) {
    return jsonError(error);
  }
}
