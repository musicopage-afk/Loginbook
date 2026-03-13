import Link from "next/link";
import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { requirePageUser } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { buildEntryWhere } from "@/lib/queries";
import { listEntries } from "@/lib/services/entries";

export default async function LogbookDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePageUser(UserRole.READER);
  const { id } = await params;
  const filters = await searchParams;

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
      from: typeof filters.from === "string" ? filters.from : undefined,
      to: typeof filters.to === "string" ? filters.to : undefined,
      tag: typeof filters.tag === "string" ? filters.tag : undefined,
      author: typeof filters.author === "string" ? filters.author : undefined,
      status: typeof filters.status === "string" ? filters.status : undefined,
      q: typeof filters.q === "string" ? filters.q : undefined
    })
  );

  const users = await prisma.user.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { displayName: "asc" }
  });

  return (
    <AppShell user={user}>
      <div className="grid two">
        <section className="card">
          <h1>{logbook.name}</h1>
          <div className="row">
            <span className="pill">{logbook.type}</span>
            <Link className="button primary" href={`/logbooks/${logbook.id}/entries/new`}>
              New entry
            </Link>
            <a className="button" href={`/api/export/logbooks/${logbook.id}`}>
              Export CSV
            </a>
          </div>
        </section>
        <section className="card">
          <h2>Filters</h2>
          <form method="GET">
            <label>
              Search
              <input name="q" defaultValue={typeof filters.q === "string" ? filters.q : ""} />
            </label>
            <label>
              Status
              <select name="status" defaultValue={typeof filters.status === "string" ? filters.status : ""}>
                <option value="">Any</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="APPROVED">Approved</option>
                <option value="SUPERSEDED">Superseded</option>
                <option value="DELETED">Deleted</option>
              </select>
            </label>
            <label>
              Tag
              <input name="tag" defaultValue={typeof filters.tag === "string" ? filters.tag : ""} />
            </label>
            <label>
              Author
              <select name="author" defaultValue={typeof filters.author === "string" ? filters.author : ""}>
                <option value="">Any</option>
                {users.map((author) => (
                  <option key={author.id} value={author.id}>{author.displayName}</option>
                ))}
              </select>
            </label>
            <label>
              From
              <input name="from" type="datetime-local" />
            </label>
            <label>
              To
              <input name="to" type="datetime-local" />
            </label>
            <button className="primary" type="submit">Apply filters</button>
          </form>
        </section>
      </div>
      <section className="card">
        <h2>Entries</h2>
        <table>
          <thead>
            <tr>
              <th>Occurred</th>
              <th>Title</th>
              <th>Author</th>
              <th>Status</th>
              <th>Tags</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.occurredAt.toISOString()}</td>
                <td><Link href={`/entries/${entry.id}`}>{entry.title}</Link></td>
                <td>{entry.createdByUser.displayName}</td>
                <td>{entry.status}</td>
                <td>{entry.tags.map((tag) => tag.tag.name).join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 ? <div className="empty">No entries match the current filters.</div> : null}
      </section>
    </AppShell>
  );
}
