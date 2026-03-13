import argon2 from "argon2";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

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
        email: "admin@loginbook.local"
      }
    },
    update: {},
    create: {
      organizationId: organization.id,
      email: "admin@loginbook.local",
      displayName: "Admin User",
      passwordHash,
      role: UserRole.ADMIN
    }
  });

  const approver = await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: organization.id,
        email: "approver@loginbook.local"
      }
    },
    update: {},
    create: {
      organizationId: organization.id,
      email: "approver@loginbook.local",
      displayName: "Approver User",
      passwordHash,
      role: UserRole.APPROVER
    }
  });

  const logbook = await prisma.logbook.upsert({
    where: {
      organizationId_name: {
        organizationId: organization.id,
        name: "Operations"
      }
    },
    update: {},
    create: {
      organizationId: organization.id,
      name: "Operations",
      type: "GENERAL"
    }
  });

  const handoverTag = await prisma.tag.upsert({
    where: {
      organizationId_name: {
        organizationId: organization.id,
        name: "handover"
      }
    },
    update: {},
    create: {
      organizationId: organization.id,
      name: "handover"
    }
  });

  const entry = await prisma.entry.create({
    data: {
      logbookId: logbook.id,
      createdByUserId: admin.id,
      title: "Shift handover completed",
      body: "Checked alarms, backup generator and fuel levels.",
      occurredAt: new Date(),
      status: "SUBMITTED",
      structuredFieldsJson: {
        location: "Plant A",
        severity: "info"
      },
      tags: {
        create: {
          tagId: handoverTag.id
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
        entityId: "seed-session"
      }
    ],
    skipDuplicates: true
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
