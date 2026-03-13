import Link from "next/link";
import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { ACTIVE_LOG_TAG } from "@/lib/constants";
import { formatGmtTimestamp, getLogFields } from "@/lib/entry-presentation";
import { buildEntryWhere } from "@/lib/queries";
import { requirePageUser } from "@/lib/server-auth";
import { listEntries } from "@/lib/services/entries";
import { listLogbooks } from "@/lib/services/logbooks";

export const dynamic = "force-dynamic";

export default async function CurrentPeoplePage() {
  const user = await requirePageUser(UserRole.READER);
  const [logbook] = await listLogbooks(user.organizationId);

  const activeEntries = await listEntries(
    buildEntryWhere(user.organizationId, logbook.id, {
      tag: ACTIVE_LOG_TAG
    })
  );

  return (
    <AppShell user={user}>
      <section className="card">
        <h1>People currently in the building</h1>
        <p className="muted">
          This list is taken from active log entries in the shared company log book.
        </p>
      </section>
      <section className="current-people-list">
        {activeEntries.map((entry) => {
          const fields = getLogFields(entry);

          return (
            <article key={entry.id} className="card current-people-card">
              <div className="current-people-header">
                <div>
                  <h2>{fields.name}</h2>
                  <span className="log-tag log-tag-active">Active</span>
                </div>
                <span className="timestamp-text">{formatGmtTimestamp(entry.createdAt)}</span>
              </div>
              <div className="current-people-grid">
                <div>
                  <span className="home-preview-label">Company</span>
                  <strong>{fields.company}</strong>
                </div>
                <div>
                  <span className="home-preview-label">Authorised by</span>
                  <strong>{fields.authorisedBy}</strong>
                </div>
                <div className="current-people-reason">
                  <span className="home-preview-label">Reason</span>
                  <strong>{fields.reason}</strong>
                </div>
              </div>
              <div className="row">
                <Link className="button" href={`/entries/${entry.id}`}>
                  View log
                </Link>
              </div>
            </article>
          );
        })}
        {activeEntries.length === 0 ? (
          <div className="card empty">No one is currently marked as active in the building.</div>
        ) : null}
      </section>
    </AppShell>
  );
}
