import Link from "next/link";
import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { ApprovalPanel } from "@/components/approval-panel";
import { EntryForm } from "@/components/entry-form";
import { requirePageUser } from "@/lib/server-auth";
import { getEntry } from "@/lib/services/entries";
import { prisma } from "@/lib/prisma";
import { canApproveEntry, canCreateEntry } from "@/lib/rbac";

export default async function EntryDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageUser(UserRole.READER);
  const { id } = await params;
  const entry = await getEntry(id, user.organizationId);

  if (!entry) {
    return (
      <AppShell user={user}>
        <div className="card">Entry not found.</div>
      </AppShell>
    );
  }

  const history = await prisma.auditEvent.findMany({
    where: {
      organizationId: user.organizationId,
      entityType: "ENTRY",
      entityId: entry.id
    },
    include: {
      user: true
    },
    orderBy: {
      occurredAt: "desc"
    }
  });

  return (
    <AppShell user={user}>
      <div className="grid two">
        <section className="card">
          <h1>{entry.title}</h1>
          <div className="row">
            <span className="pill">{entry.status}</span>
            <span className="muted">Occurred {entry.occurredAt.toISOString()}</span>
          </div>
          <p>{entry.body}</p>
          <div className="muted mono">Structured fields: {JSON.stringify(entry.structuredFieldsJson)}</div>
          <div className="row">
            {entry.tags.map((tag) => (
              <span className="pill" key={tag.tagId}>{tag.tag.name}</span>
            ))}
          </div>
          <div className="stack">
            <strong>Attachments</strong>
            {entry.attachments.map((attachment) => (
              <div key={attachment.id}>
                {attachment.filename} · {attachment.contentType} · {attachment.byteSize} bytes
                <div className="muted mono">{attachment.sha256}</div>
              </div>
            ))}
            {entry.attachments.length === 0 ? <div className="empty">No attachments.</div> : null}
          </div>
          {entry.status === "APPROVED" && canCreateEntry(user.role) ? (
            <div className="card">
              <h3>Supersede approved entry</h3>
              <EntryForm logbookId={entry.logbookId} supersedesEntryId={entry.id} />
            </div>
          ) : null}
        </section>
        <section className="card">
          <h2>Approvals</h2>
          {entry.approvedAt ? (
            <div className="stack">
              <div>Approved at {entry.approvedAt.toISOString()}</div>
              <div>Approved by {entry.approvedByUser?.displayName ?? "Unknown"}</div>
            </div>
          ) : canApproveEntry(user.role) ? (
            <ApprovalPanel entryId={entry.id} />
          ) : (
            <div className="empty">Only approvers can lock an entry.</div>
          )}
          {entry.supersedesEntry ? (
            <div className="stack">
              <strong>Supersedes</strong>
              <Link href={`/entries/${entry.supersedesEntry.id}`}>{entry.supersedesEntry.title}</Link>
            </div>
          ) : null}
          {entry.supersededByEntries.length > 0 ? (
            <div className="stack">
              <strong>Superseded by</strong>
              {entry.supersededByEntries.map((item) => (
                <Link key={item.id} href={`/entries/${item.id}`}>{item.title}</Link>
              ))}
            </div>
          ) : null}
        </section>
      </div>
      <section className="card">
        <h2>History</h2>
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Action</th>
              <th>Actor</th>
              <th>Before</th>
              <th>After</th>
            </tr>
          </thead>
          <tbody>
            {history.map((event) => (
              <tr key={event.id}>
                <td>{event.occurredAt.toISOString()}</td>
                <td>{event.action}</td>
                <td>{event.user?.displayName ?? "System"}</td>
                <td className="mono">{JSON.stringify(event.beforeJson)}</td>
                <td className="mono">{JSON.stringify(event.afterJson)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
