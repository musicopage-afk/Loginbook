import Link from "next/link";
import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { getLogFields } from "@/lib/entry-presentation";
import { requirePageUser } from "@/lib/server-auth";
import { getEntry } from "@/lib/services/entries";

export const dynamic = "force-dynamic";

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
        <div className="card">Log not found.</div>
      </AppShell>
    );
  }

  const fields = getLogFields(entry);

  return (
    <AppShell user={user}>
      <div className="grid two">
        <section className="card">
          <div className="embed">
            <div className="embed-title">
              <strong>{fields.name}</strong> | {fields.entryOrExit === "ENTRY" ? "Entry" : "Exit"}
            </div>
            <div className="embed-grid">
              <div className="embed-field">
                <span className="embed-label">Name</span>
                <span>{fields.name}</span>
              </div>
              <div className="embed-field">
                <span className="embed-label">Entry or Exit</span>
                <span>{fields.entryOrExit === "ENTRY" ? "Entry" : "Exit"}</span>
              </div>
              <div className="embed-field">
                <span className="embed-label">Reason</span>
                <span>{fields.reason}</span>
              </div>
              <div className="embed-field">
                <span className="embed-label">Authorised by</span>
                <span>{fields.authorisedBy}</span>
              </div>
              <div className="embed-field">
                <span className="embed-label">Company</span>
                <span>{fields.company}</span>
              </div>
              <div className="embed-field">
                <span className="embed-label">Timestamp</span>
                <span className="timestamp-text">{fields.timestamp}</span>
              </div>
            </div>
          </div>
        </section>
        <section className="card">
          <h2>Record links</h2>
          <div className="empty">Logs are saved immediately and do not need approval.</div>
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
    </AppShell>
  );
}
