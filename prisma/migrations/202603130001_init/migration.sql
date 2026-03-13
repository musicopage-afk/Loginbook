-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('READER', 'CONTRIBUTOR', 'EDITOR', 'APPROVER', 'AUDITOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'SUPERSEDED', 'DELETED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'LOGIN', 'LOGOUT', 'EXPORT', 'UPLOAD', 'SUPERSEDE');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('ORGANIZATION', 'USER', 'SESSION', 'LOGBOOK', 'ENTRY', 'TAG', 'ATTACHMENT', 'AUDIT_EVENT');

CREATE TABLE "organizations" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sessions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "revoked_at" TIMESTAMP(3),
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "logbooks" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "is_archived" BOOLEAN NOT NULL DEFAULT false,
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "logbooks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "entries" (
  "id" TEXT NOT NULL,
  "logbook_id" TEXT NOT NULL,
  "created_by_user_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "structured_fields_json" JSONB NOT NULL DEFAULT '{}',
  "status" "EntryStatus" NOT NULL DEFAULT 'DRAFT',
  "occurred_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approved_at" TIMESTAMP(3),
  "approved_by_user_id" TEXT,
  "supersedes_entry_id" TEXT,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tags" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "entry_tags" (
  "entry_id" TEXT NOT NULL,
  "tag_id" TEXT NOT NULL,
  CONSTRAINT "entry_tags_pkey" PRIMARY KEY ("entry_id", "tag_id")
);

CREATE TABLE "attachments" (
  "id" TEXT NOT NULL,
  "entry_id" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "content_type" TEXT NOT NULL,
  "byte_size" INTEGER NOT NULL,
  "sha256" TEXT NOT NULL,
  "storage_uri" TEXT NOT NULL,
  "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_events" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "user_id" TEXT,
  "action" "AuditAction" NOT NULL,
  "entity_type" "EntityType" NOT NULL,
  "entity_id" TEXT NOT NULL,
  "before_json" JSONB,
  "after_json" JSONB,
  "ip" TEXT,
  "user_agent" TEXT,
  "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_organization_id_email_key" ON "users"("organization_id", "email");
CREATE UNIQUE INDEX "logbooks_organization_id_name_key" ON "logbooks"("organization_id", "name");
CREATE UNIQUE INDEX "tags_organization_id_name_key" ON "tags"("organization_id", "name");
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX "entries_logbook_id_occurred_at_idx" ON "entries"("logbook_id", "occurred_at");
CREATE INDEX "entries_created_by_user_id_idx" ON "entries"("created_by_user_id");
CREATE INDEX "attachments_entry_id_idx" ON "attachments"("entry_id");
CREATE INDEX "audit_events_organization_id_occurred_at_idx" ON "audit_events"("organization_id", "occurred_at");
CREATE INDEX "audit_events_entity_type_entity_id_idx" ON "audit_events"("entity_type", "entity_id");
CREATE INDEX "audit_events_user_id_idx" ON "audit_events"("user_id");

ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "logbooks" ADD CONSTRAINT "logbooks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "entries" ADD CONSTRAINT "entries_logbook_id_fkey" FOREIGN KEY ("logbook_id") REFERENCES "logbooks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "entries" ADD CONSTRAINT "entries_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "entries" ADD CONSTRAINT "entries_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "entries" ADD CONSTRAINT "entries_supersedes_entry_id_fkey" FOREIGN KEY ("supersedes_entry_id") REFERENCES "entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tags" ADD CONSTRAINT "tags_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "entry_tags" ADD CONSTRAINT "entry_tags_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "entry_tags" ADD CONSTRAINT "entry_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION prevent_audit_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only';
END;
$$;

CREATE TRIGGER audit_events_no_update
BEFORE UPDATE ON "audit_events"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_event_mutation();

CREATE TRIGGER audit_events_no_delete
BEFORE DELETE ON "audit_events"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_event_mutation();
