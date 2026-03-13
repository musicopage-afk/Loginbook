import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";
import { enforceStateChangingRequest, getRequestMeta, jsonError, jsonOk, requireApiUser } from "@/lib/api";
import { buildEntryWhere } from "@/lib/queries";
import { listEntries, createEntry } from "@/lib/services/entries";
import { createEntrySchema, logbookFilterSchema } from "@/lib/validation";

function mapTags(input: FormDataEntryValue | null) {
  return String(input ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiUser(UserRole.READER);
    const { id } = await params;
    const filters = logbookFilterSchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
    const entries = await listEntries(buildEntryWhere(user.organizationId, id, filters));
    return jsonOk({ entries });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireApiUser(UserRole.CONTRIBUTOR);
    await enforceStateChangingRequest(request);
    const { id } = await params;
    const meta = getRequestMeta(request);

    let payload: z.infer<typeof createEntrySchema>;
    let files: File[] = [];

    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      payload = createEntrySchema.parse({
        title: form.get("title"),
        body: form.get("body"),
        occurredAt: form.get("occurredAt"),
        tags: mapTags(form.get("tags")),
        structuredFieldsJson: JSON.parse(String(form.get("structuredFieldsJson") ?? "{}")),
        supersedesEntryId: form.get("supersedesEntryId") || undefined
      });
      files = form.getAll("attachments").filter((item): item is File => item instanceof File);
    } else {
      const body = await request.json();
      payload = createEntrySchema.parse({
        ...body,
        tags: Array.isArray(body.tags) ? body.tags : []
      });
    }

    const entry = await createEntry(
      {
        organizationId: user.organizationId,
        userId: user.id,
        role: user.role,
        ip: meta.ip,
        userAgent: meta.userAgent
      },
      {
        logbookId: id,
        ...payload,
        files
      }
    );

    return jsonOk({ entry }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
