import { beforeEach, describe, expect, it, vi } from "vitest";
import { EntryStatus, UserRole } from "@prisma/client";

const createAuditEvent = vi.fn();
const getStorageAdapter = vi.fn();

const tx = {
  entry: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  },
  tag: {
    upsert: vi.fn(),
    findMany: vi.fn()
  },
  entryTag: {
    createMany: vi.fn(),
    deleteMany: vi.fn()
  },
  attachment: {
    create: vi.fn()
  }
};

const prisma = {
  $transaction: vi.fn(),
  entry: {
    findFirst: vi.fn(),
    update: vi.fn()
  }
};

vi.mock("@/lib/audit", () => ({
  createAuditEvent
}));

vi.mock("@/lib/storage", () => ({
  getStorageAdapter
}));

vi.mock("@/lib/prisma", () => ({
  prisma
}));

describe("entry services", () => {
  beforeEach(() => {
    vi.resetModules();
    createAuditEvent.mockReset();
    getStorageAdapter.mockReset();
    prisma.$transaction.mockReset();
    prisma.entry.findFirst.mockReset();
    prisma.entry.update.mockReset();
    tx.entry.findUnique.mockReset();
    tx.entry.findFirst.mockReset();
    tx.entry.findMany.mockReset();
    tx.entry.create.mockReset();
    tx.entry.update.mockReset();
    tx.tag.upsert.mockReset();
    tx.tag.findMany.mockReset();
    tx.entryTag.createMany.mockReset();
    tx.entryTag.deleteMany.mockReset();
    tx.attachment.create.mockReset();
    prisma.$transaction.mockImplementation(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx));
  });

  it("rejects create entry for insufficient role", async () => {
    const { createEntry } = await import("@/lib/services/entries");

    await expect(
      createEntry(
        {
          organizationId: "org_1",
          userId: "user_1",
          role: UserRole.READER
        },
        {
          logbookId: "lb_1",
          title: "Test",
          body: "Body",
          occurredAt: "2026-03-13T10:00:00.000Z",
          tags: [],
          structuredFieldsJson: {}
        }
      )
    ).rejects.toMatchObject({ status: 403 });
  });

  it("creates a superseding entry with attachment and audit trail", async () => {
    const { createEntry } = await import("@/lib/services/entries");
    const prior = {
      id: "entry_old",
      status: EntryStatus.APPROVED,
      title: "Prior"
    };
    const createdEntry = {
      id: "entry_new",
      title: "Replacement",
      body: "Updated",
      occurredAt: new Date("2026-03-13T10:00:00.000Z")
    };

    tx.entry.findUnique.mockResolvedValue(prior);
    tx.entry.update.mockResolvedValue({ ...prior, status: EntryStatus.SUPERSEDED });
    tx.entry.create.mockResolvedValue(createdEntry);
    tx.tag.findMany.mockResolvedValue([{ id: "tag_1", name: "active" }]);
    tx.entry.findMany.mockResolvedValue([]);
    getStorageAdapter.mockReturnValue({
      save: vi.fn().mockResolvedValue({
        storageUri: "/tmp/file.txt",
        sha256: "abc123",
        byteSize: 4,
        contentType: "text/plain",
        filename: "file.txt"
      })
    });
    tx.attachment.create.mockResolvedValue({ id: "att_1", filename: "file.txt" });

    const file = new File(["test"], "file.txt", { type: "text/plain" });
    const result = await createEntry(
      {
        organizationId: "org_1",
        userId: "user_1",
        role: UserRole.EDITOR
      },
      {
        logbookId: "lb_1",
        title: "Replacement",
        body: "Updated",
        occurredAt: "2026-03-13T10:00:00.000Z",
        tags: ["handover", "handover"],
        structuredFieldsJson: { severity: "info" },
        supersedesEntryId: "entry_old",
        files: [file]
      }
    );

    expect(result).toBe(createdEntry);
    expect(tx.entry.update).toHaveBeenCalledWith({
      where: { id: "entry_old" },
      data: { status: EntryStatus.SUPERSEDED }
    });
    expect(tx.entryTag.createMany).toHaveBeenCalled();
    expect(tx.attachment.create).toHaveBeenCalled();
    expect(createAuditEvent).toHaveBeenCalledTimes(3);
  });

  it("rejects attachments larger than the configured limit", async () => {
    const { createEntry } = await import("@/lib/services/entries");

    tx.entry.create.mockResolvedValue({
      id: "entry_new",
      occurredAt: new Date("2026-03-13T10:00:00.000Z")
    });
    tx.tag.findMany.mockResolvedValue([]);
    tx.entry.findMany.mockResolvedValue([]);
    getStorageAdapter.mockReturnValue({
      save: vi.fn()
    });

    const file = new File([new Uint8Array(20 * 1024 * 1024 + 1)], "large.bin", {
      type: "application/octet-stream"
    });

    await expect(
      createEntry(
        {
          organizationId: "org_1",
          userId: "user_1",
          role: UserRole.CONTRIBUTOR
        },
        {
          logbookId: "lb_1",
          title: "Big attachment",
          body: "Body",
          occurredAt: "2026-03-13T10:00:00.000Z",
          tags: [],
          structuredFieldsJson: {},
          files: [file]
        }
      )
    ).rejects.toMatchObject({ status: 413 });
  });

  it("allows updates to previously approved entries", async () => {
    const { updateEntry } = await import("@/lib/services/entries");

    tx.entry.findUnique.mockResolvedValue({
      id: "entry_1",
      status: EntryStatus.APPROVED,
      logbook: {
        organizationId: "org_1"
      }
    });

    tx.entry.update.mockResolvedValue({
      id: "entry_1",
      status: EntryStatus.APPROVED,
      title: "Updated"
    });
    tx.tag.findMany.mockResolvedValue([]);

    const result = await updateEntry(
      {
        organizationId: "org_1",
        userId: "user_1",
        role: UserRole.EDITOR
      },
      "entry_1",
      {
        title: "Updated",
        body: "Body",
        occurredAt: "2026-03-13T10:00:00.000Z",
        tags: [],
        structuredFieldsJson: {}
      }
    );

    expect(result.title).toBe("Updated");
  });

  it("creates exit entries with the past tag and inactivates matching active logs", async () => {
    const { createEntry } = await import("@/lib/services/entries");

    tx.entry.create.mockResolvedValue({
      id: "entry_exit",
      title: "Front Gate"
    });
    tx.tag.findMany
      .mockResolvedValueOnce([{ id: "tag_past", name: "past" }])
      .mockResolvedValueOnce([
        { id: "tag_active", name: "active" },
        { id: "tag_inactive", name: "inactive" }
      ]);
    tx.entry.findMany.mockResolvedValue([{ id: "entry_active" }]);

    await createEntry(
      {
        organizationId: "org_1",
        userId: "user_1",
        role: UserRole.EDITOR
      },
      {
        logbookId: "lb_1",
        title: "Front Gate",
        body: "Signed out",
        occurredAt: "2026-03-13T10:00:00.000Z",
        tags: [],
        structuredFieldsJson: {
          entryOrExit: "EXIT"
        }
      }
    );

    expect(tx.entryTag.createMany).toHaveBeenCalledWith({
      data: [{ entryId: "entry_exit", tagId: "tag_past" }],
      skipDuplicates: true
    });
    expect(tx.entryTag.deleteMany).toHaveBeenCalledWith({
      where: {
        entryId: "entry_active",
        tagId: "tag_active"
      }
    });
  });

  it("approves entries and records the approval actor", async () => {
    const { approveEntry } = await import("@/lib/services/entries");

    prisma.entry.findFirst.mockResolvedValue({
      id: "entry_1",
      status: EntryStatus.SUBMITTED
    });
    prisma.entry.update.mockResolvedValue({
      id: "entry_1",
      status: EntryStatus.APPROVED,
      approvedByUserId: "user_2"
    });

    const result = await approveEntry(
      {
        organizationId: "org_1",
        userId: "user_2",
        role: UserRole.APPROVER
      },
      "entry_1",
      "Looks good"
    );

    expect(result.status).toBe(EntryStatus.APPROVED);
    expect(prisma.entry.update).toHaveBeenCalled();
    expect(createAuditEvent).toHaveBeenCalledTimes(1);
  });
});
