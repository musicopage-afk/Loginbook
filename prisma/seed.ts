import argon2 from "argon2";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();
const DEFAULT_LOGBOOK_NAME = "Log Book";
const DEFAULT_LOGBOOK_TYPE = "LOG_BOOK";
const ACTIVE_LOG_TAG = "active";

async function main() {
  const organization = await prisma.organization.upsert({
    where: { id: "seed-org" },
    update: {},
    create: {
      id: "seed-org",
      name: "Acme Operations"
    }
  });

  const passwordHash = await argon2.hash("ChangeMe123!");

  const admin = await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: organization.id,
        email: "admin"
      }
    },
    update: {},
    create: {
      organizationId: organization.id,
      email: "admin",
      displayName: "Admin User",
      passwordHash,
      role: UserRole.ADMIN
    }
  });

  const approver = await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: organization.id,
        email: "approver"
      }
    },
    update: {},
    create: {
      organizationId: organization.id,
      email: "approver",
      displayName: "Approver User",
      passwordHash,
      role: UserRole.APPROVER
    }
  });

  const logbook = await prisma.logbook.upsert({
    where: {
      organizationId_name: {
        organizationId: organization.id,
        name: DEFAULT_LOGBOOK_NAME
      }
    },
    update: {},
    create: {
      organizationId: organization.id,
      name: DEFAULT_LOGBOOK_NAME,
      type: DEFAULT_LOGBOOK_TYPE
    }
  });

  const activeTag = await prisma.tag.upsert({
    where: {
      organizationId_name: {
        organizationId: organization.id,
        name: ACTIVE_LOG_TAG
      }
    },
    update: {},
    create: {
      organizationId: organization.id,
      name: ACTIVE_LOG_TAG
    }
  });

  const entry = await prisma.entry.upsert({
    where: { id: "seed-entry-front-gate" },
    update: {},
    create: {
      id: "seed-entry-front-gate",
      logbookId: logbook.id,
      createdByUserId: admin.id,
      title: "Front Gate",
      body: "Contractor signed in for a scheduled maintenance visit.",
      occurredAt: new Date("2026-03-13T09:00:00.000Z"),
      status: "SUBMITTED",
      structuredFieldsJson: {
        entryOrExit: "ENTRY",
        authorisedBy: "Admin User",
        company: "Acme Operations"
      },
      tags: {
        create: {
          tagId: activeTag.id
        }
      }
    }
  });

  await prisma.auditEvent.upsert({
    where: { id: "seed-audit-entry-create" },
    update: {},
    create: {
      id: "seed-audit-entry-create",
      organizationId: organization.id,
      userId: admin.id,
      action: "CREATE",
      entityType: "ENTRY",
      entityId: entry.id,
      afterJson: {
        title: entry.title,
        status: entry.status
      }
    }
  });

  await prisma.auditEvent.upsert({
    where: { id: "seed-audit-login" },
    update: {},
    create: {
      id: "seed-audit-login",
      organizationId: organization.id,
      userId: approver.id,
      action: "LOGIN",
      entityType: "SESSION",
      entityId: "seed-session"
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
