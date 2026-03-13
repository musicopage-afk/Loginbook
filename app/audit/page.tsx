import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { requirePageUser } from "@/lib/server-auth";
import { listAuditEvents } from "@/lib/services/audit";

export const dynamic = "force-dynamic";

export default async function AuditPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePageUser(UserRole.AUDITOR);
  const filters = await searchParams;
  const events = await listAuditEvents(user.organizationId, {
    userId: typeof filters.userId === "string" ? filters.userId : undefined,
    action: typeof filters.action === "string" ? filters.action : undefined,
    entityType: typeof filters.entityType === "string" ? filters.entityType : undefined,
    from: typeof filters.from === "string" ? filters.from : undefined,
    to: typeof filters.to === "string" ? filters.to : undefined
  });

  return (
    <AppShell user={user}>
      <div className="grid two">
        <section className="card">
          <h1>Audit events</h1>
          <a className="button" href="/api/export/audit.csv">Export audit CSV</a>
        </section>
        <section className="card">
          <h2>Filters</h2>
          <form method="GET">
            <label>
              User ID
              <input name="userId" defaultValue={typeof filters.userId === "string" ? filters.userId : ""} />
            </label>
            <label>
              Action
              <input name="action" defaultValue={typeof filters.action === "string" ? filters.action : ""} />
            </label>
            <label>
              Entity type
              <input name="entityType" defaultValue={typeof filters.entityType === "string" ? filters.entityType : ""} />
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
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>User</th>
              <th>Action</th>
              <th>Entity</th>
              <th>IP</th>
              <th>User agent</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td>{event.occurredAt.toISOString()}</td>
                <td>{event.user?.displayName ?? "System"}</td>
                <td>{event.action}</td>
                <td>{event.entityType}:{event.entityId}</td>
                <td>{event.ip}</td>
                <td>{event.userAgent}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 ? <div className="empty">No audit events match the current filters.</div> : null}
      </section>
    </AppShell>
  );
}
