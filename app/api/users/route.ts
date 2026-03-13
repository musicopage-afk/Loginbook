import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { enforceStateChangingRequest, getRequestMeta, jsonError, jsonOk, requireApiUser } from "@/lib/api";
import { createUser, listUsers } from "@/lib/services/users";
import { createUserSchema } from "@/lib/validation";

export async function GET() {
  try {
    const user = await requireApiUser(UserRole.ADMIN);
    const users = await listUsers(user.organizationId);

    return jsonOk({
      users: users.map((item) => ({
        id: item.id,
        username: item.email,
        role: item.role,
        status: item.status
      }))
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(UserRole.ADMIN);
    await enforceStateChangingRequest(request);
    const body = createUserSchema.parse(await request.json());
    const meta = getRequestMeta(request);
    const created = await createUser(
      {
        organizationId: user.organizationId,
        userId: user.id,
        role: user.role,
        ip: meta.ip,
        userAgent: meta.userAgent
      },
      {
        username: body.username,
        password: body.password,
        role: body.role
      }
    );

    return jsonOk(
      {
        user: {
          id: created.id,
          username: created.email,
          role: created.role,
          status: created.status
        }
      },
      { status: 201 }
    );
  } catch (error) {
    return jsonError(error);
  }
}
