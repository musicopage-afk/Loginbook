import { z } from "zod";
import { ApiError } from "@/lib/api";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";

export const loginSchema = z.object({
  username: z.string().min(3).max(60),
  password: z.string().min(8, "Password must be 8 characters or longer").max(256)
});

export const createLogbookSchema = z.object({
  name: z.string().min(2).max(120),
  type: z.string().min(2).max(60)
});

export const logbookFilterSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  tag: z.string().optional(),
  author: z.string().optional(),
  status: z.string().optional(),
  q: z.string().max(120).optional()
});

export const createEntrySchema = z.object({
  title: z.string().min(3).max(200),
  body: z.string().max(10000),
  occurredAt: z.string().datetime(),
  tags: z.array(z.string().min(1).max(60)).max(20).default([]),
  structuredFieldsJson: z.record(z.any()).default({}),
  supersedesEntryId: z.string().optional()
});

export function validateEntryPayloadByDirection(input: z.infer<typeof createEntrySchema>) {
  const direction = input.structuredFieldsJson.entryOrExit === "EXIT" ? "EXIT" : "ENTRY";
  const authorisedBy =
    typeof input.structuredFieldsJson.authorisedBy === "string" ? input.structuredFieldsJson.authorisedBy.trim() : "";
  const company =
    typeof input.structuredFieldsJson.company === "string" ? input.structuredFieldsJson.company.trim() : "";

  if (direction === "EXIT") {
    return {
      ...input,
      body: "",
      structuredFieldsJson: {
        ...input.structuredFieldsJson,
        authorisedBy: "",
        company: ""
      }
    };
  }

  if (!input.body.trim()) {
    throw new ApiError(400, "Reason is required");
  }

  if (!authorisedBy) {
    throw new ApiError(400, "Authorised by is required");
  }

  if (!company) {
    throw new ApiError(400, "Company is required");
  }

  return {
    ...input,
    body: input.body.trim(),
    structuredFieldsJson: {
      ...input.structuredFieldsJson,
      authorisedBy,
      company
    }
  };
}

export const createUserSchema = z.object({
  username: z.string().min(3).max(60),
  password: z.string().min(8, "Password must be 8 characters or longer").max(256),
  role: z.enum(["READER", "CONTRIBUTOR", "EDITOR", "APPROVER", "AUDITOR", "ADMIN"])
});

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "DISABLED"])
});

export const updateUserCredentialsSchema = z.object({
  username: z.string().min(3).max(60),
  password: z.string().min(8, "Password must be 8 characters or longer").max(256).optional(),
  role: z.enum(["READER", "CONTRIBUTOR", "EDITOR", "APPROVER", "AUDITOR", "ADMIN"])
});

export const approveEntrySchema = z.object({
  note: z.string().max(500).optional()
});

export const auditFilterSchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional()
});

export const uploadMetadataSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1).max(200),
  byteSize: z.number().int().positive().max(MAX_UPLOAD_BYTES)
});
