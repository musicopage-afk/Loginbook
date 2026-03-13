import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { requirePageUser } from "@/lib/server-auth";
import { listAuditEvents } from "@/lib/services/audit";

export const dynamic = "force-dynamic";

function formatAuditTime(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(value);
}

function getAuditActor(event: Awaited<ReturnType<typeof listAuditEvents>>[number]) {
  return event.user ? `(${event.user.role}) User` : "System";
}

function getAuditPermissionGroup(event: Awaited<ReturnType<typeof listAuditEvents>>[number]) {
  return event.user?.role ?? "SYSTEM";
}

function getAuditMessage(event: Awaited<ReturnType<typeof listAuditEvents>>[number]) {
  const actor = getAuditActor(event);

  if (event.action === "LOGIN") {
    return `${actor} signed in.`;
  }

  if (event.action === "LOGOUT") {
    return `${actor} signed out.`;
  }

  if (event.action === "CREATE" && event.entityType === "ENTRY") {
    return `${actor} created a log entry.`;
  }

  if (event.action === "UPDATE" && event.entityType === "ENTRY") {
    return `${actor} updated a log entry.`;
  }

  if (event.action === "DELETE" && event.entityType === "ENTRY") {
    return `${actor} deleted a log entry.`;
  }

  if (event.action === "APPROVE" && event.entityType === "ENTRY") {
    return `${actor} approved a log entry.`;
  }

  if (event.action === "CREATE" && event.entityType === "USER") {
    return `${actor} created an account.`;
  }

  if (event.action === "UPDATE" && event.entityType === "USER") {
    return `${actor} changed an account.`;
  }

  if (event.action === "EXPORT") {
    return `${actor} exported records.`;
  }

  return `${actor} performed ${event.action.toLowerCase()} on ${event.entityType.toLowerCase()}.`;
}

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
        <div className="audit-feed">
          {events.map((event) => (
            <article key={event.id} className="audit-item">
              <div className="audit-meta">
                <span className="timestamp-text">{formatAuditTime(event.occurredAt)}</span>
                <span className="pill audit-pill">{getAuditActor(event)}</span>
                <span className="pill audit-pill">{getAuditPermissionGroup(event)}</span>
              </div>
              <strong>{getAuditMessage(event)}</strong>
              <span className="muted">Device: {event.userAgent ?? "Unknown device"}</span>
            </article>
          ))}
        </div>
        {events.length === 0 ? <div className="empty">No audit events match the current filters.</div> : null}
      </section>
    </AppShell>
  );
}
