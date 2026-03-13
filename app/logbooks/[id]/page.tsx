import Link from "next/link";
import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { EntryRowActions } from "@/components/entry-row-actions";
import { ACTIVE_LOG_TAG, INACTIVE_LOG_TAG, PAST_LOG_TAG } from "@/lib/constants";
import { formatGmtTimestamp, getLifecycleSortOrder, getLogFields, type LogLifecycle } from "@/lib/entry-presentation";
import { requirePageUser } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { buildEntryWhere } from "@/lib/queries";
import { listEntries } from "@/lib/services/entries";

export const dynamic = "force-dynamic";

const lifecycleFilters = [
  { label: "Active Logs", value: ACTIVE_LOG_TAG },
  { label: "Past Logs", value: PAST_LOG_TAG },
  { label: "Inactive Logs", value: INACTIVE_LOG_TAG }
] as const;

function getLifecycle(entry: Awaited<ReturnType<typeof listEntries>>[number]): LogLifecycle {
  const tagNames = new Set(entry.tags.map((item) => item.tag.name));

  if (tagNames.has(ACTIVE_LOG_TAG)) {
    return "active";
  }

  if (tagNames.has(PAST_LOG_TAG)) {
    return "past";
  }

  return "inactive";
}

export default async function LogbookDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tag?: string }>;
}) {
  const user = await requirePageUser(UserRole.READER);
  const { id } = await params;
  const { tag } = await searchParams;
  const selectedTag = tag === ACTIVE_LOG_TAG || tag === PAST_LOG_TAG || tag === INACTIVE_LOG_TAG ? tag : undefined;

  const logbook = await prisma.logbook.findFirst({
    where: {
      id,
      organizationId: user.organizationId,
      deletedAt: null
    }
  });

  if (!logbook) {
    return (
      <AppShell user={user}>
        <div className="card">Logbook not found.</div>
      </AppShell>
    );
  }

  const entries = await listEntries(
    buildEntryWhere(user.organizationId, logbook.id, {
      from: undefined,
      to: undefined,
      tag: selectedTag,
      author: undefined,
      status: undefined,
      q: undefined
    })
  );
  const sortedEntries = [...entries].sort((left, right) => {
    const lifecycleOrder = getLifecycleSortOrder(getLifecycle(left)) - getLifecycleSortOrder(getLifecycle(right));

    if (lifecycleOrder !== 0) {
      return lifecycleOrder;
    }

    return right.createdAt.getTime() - left.createdAt.getTime();
  });

  return (
    <AppShell user={user}>
      <section className="card">
        <h1>{logbook.name}</h1>
        <div className="row">
          <Link className="button primary" href={`/logbooks/${logbook.id}/entries/new`}>
            Create log
          </Link>
          <a className="button" href={`/api/export/logbooks/${logbook.id}`}>
            Export CSV
          </a>
        </div>
      </section>
      <section className="card">
        <h2>Entries</h2>
        <div className="log-filter-bar" role="tablist" aria-label="Log lifecycle filters">
          <Link
            href={`/logbooks/${logbook.id}`}
            className={`filter-chip ${!selectedTag ? "is-selected" : ""}`}
          >
            All Logs
          </Link>
          {lifecycleFilters.map((filter) => (
            <Link
              key={filter.value}
              href={`/logbooks/${logbook.id}?tag=${filter.value}`}
              className={`filter-chip filter-${filter.value} ${selectedTag === filter.value ? "is-selected" : ""}`}
            >
              {filter.label}
            </Link>
          ))}
        </div>
        <div className="entry-list">
          {sortedEntries.map((entry) => {
            const fields = getLogFields(entry);
            const lifecycle = getLifecycle(entry);

            return (
              <div key={entry.id} className="entry-row">
                <div className="entry-summary">
                  <strong>{fields.name}</strong>
                  <span className={`log-tag log-tag-${lifecycle}`}>{lifecycle}</span>
                </div>
                <EntryRowActions entryId={entry.id} entryName={fields.name} />
                <span className="timestamp-text">{formatGmtTimestamp(entry.createdAt)}</span>
              </div>
            );
          })}
        </div>
        {sortedEntries.length === 0 ? <div className="empty">No logs have been added yet.</div> : null}
      </section>
    </AppShell>
  );
}
