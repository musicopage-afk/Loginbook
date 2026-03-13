import { z } from "zod";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";

export const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(256)
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
  body: z.string().min(1).max(10000),
  occurredAt: z.string().datetime(),
  tags: z.array(z.string().min(1).max(60)).max(20).default([]),
  structuredFieldsJson: z.record(z.any()).default({}),
  supersedesEntryId: z.string().optional()
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
