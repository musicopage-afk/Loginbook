import argon2 from "argon2";
import { EntryStatus, PrismaClient, UserRole, UserStatus } from "@prisma/client";
import { ACTIVE_LOG_TAG } from "@/lib/constants";

process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/loginbook?schema=public";

const prisma = new PrismaClient();

export type E2EFixture = {
  organizationId: string;
  adminEmail: string;
  adminPassword: string;
  adminDisplayName: string;
  approverEmail: string;
  logbookName: string;
  seededEntryName: string;
};

const ADMIN_PASSWORD = "ChangeMe123!";

function createSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function resetE2EData(): Promise<E2EFixture> {
  const suffix = createSuffix();
  const organizationId = `e2e-org-${suffix}`;
  const adminEmail = `e2e-admin+${suffix}@loginbook.local`;
  const approverEmail = `e2e-approver+${suffix}@loginbook.local`;
  const logbookName = "Log Book";
  const seededEntryName = "Front Gate";
  const adminDisplayName = "E2E Admin";

  const organization = await prisma.organization.create({
    data: {
      id: organizationId,
      name: `E2E Operations ${suffix}`
    }
  });

  const passwordHash = await argon2.hash(ADMIN_PASSWORD);
  const admin = await prisma.user.create({
    data: {
      organizationId: organization.id,
      email: adminEmail,
      displayName: adminDisplayName,
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE
    }
  });

  const approver = await prisma.user.create({
    data: {
      organizationId: organization.id,
      email: approverEmail,
      displayName: "E2E Approver",
      passwordHash,
      role: UserRole.APPROVER,
      status: UserStatus.ACTIVE
    }
  });

  const logbook = await prisma.logbook.create({
    data: {
      organizationId: organization.id,
      name: logbookName,
      type: "LOG_BOOK"
    }
  });

  const activeTag = await prisma.tag.create({
    data: {
      organizationId: organization.id,
      name: ACTIVE_LOG_TAG
    }
  });

  const entry = await prisma.entry.create({
    data: {
      logbookId: logbook.id,
      createdByUserId: admin.id,
      title: seededEntryName,
      body: "Contractor signed in for a scheduled maintenance visit.",
      occurredAt: new Date("2026-03-13T08:30:00.000Z"),
      status: EntryStatus.SUBMITTED,
      structuredFieldsJson: {
        entryOrExit: "ENTRY",
        authorisedBy: adminDisplayName
      },
      tags: {
        create: {
          tagId: activeTag.id
        }
      }
    }
  });

  await prisma.auditEvent.createMany({
    data: [
      {
        organizationId: organization.id,
        userId: admin.id,
        action: "CREATE",
        entityType: "LOGBOOK",
        entityId: logbook.id,
        afterJson: {
          name: logbook.name,
          type: logbook.type
        }
      },
      {
        organizationId: organization.id,
        userId: admin.id,
        action: "CREATE",
        entityType: "ENTRY",
        entityId: entry.id,
        afterJson: {
          title: entry.title,
          status: entry.status
        }
      },
      {
        organizationId: organization.id,
        userId: approver.id,
        action: "LOGIN",
        entityType: "SESSION",
        entityId: `e2e-seed-session-${suffix}`
      }
    ]
  });

  return {
    organizationId,
    adminEmail,
    adminPassword: ADMIN_PASSWORD,
    adminDisplayName,
    approverEmail,
    logbookName,
    seededEntryName
  };
}

async function main() {
  const fixture = await resetE2EData();
  console.log(JSON.stringify(fixture, null, 2));
}

if (process.argv[1]?.endsWith("reset.ts")) {
  main()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
