import Link from "next/link";
import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { CreateLogbookForm } from "@/components/create-logbook-form";
import { DeleteLogbookButton } from "@/components/delete-logbook-button";
import { OfflineSync } from "@/components/offline-sync";
import { requirePageUser } from "@/lib/server-auth";
import { listLogbooks } from "@/lib/services/logbooks";
import { canCreateLogbook } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function LogbooksPage() {
  const user = await requirePageUser(UserRole.READER);
  const logbooks = await listLogbooks(user.organizationId);

  return (
    <AppShell user={user}>
      <OfflineSync />
      <div className="grid two">
        <section className="card">
          <h1>Logbooks</h1>
          <div className="stack">
            {logbooks.map((logbook) => (
              <div key={logbook.id} className="card">
                <div className="row">
                  <Link href={`/logbooks/${logbook.id}`}>
                    <strong>{logbook.name}</strong>
                  </Link>
                  <div className="row">
                    <span className="pill">{logbook.type}</span>
                    {logbook.isArchived ? <span className="pill">Archived</span> : null}
                    {canCreateLogbook(user.role) ? (
                      <DeleteLogbookButton logbookId={logbook.id} logbookName={logbook.name} />
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
            {logbooks.length === 0 ? <div className="empty">No logbooks available.</div> : null}
          </div>
        </section>
        {canCreateLogbook(user.role) ? (
          <section className="card">
            <h2>Create logbook</h2>
            <CreateLogbookForm />
          </section>
        ) : (
          <section className="card">
            <h2>Creation restricted</h2>
            <p className="muted">Only administrators can create new logbooks.</p>
          </section>
        )}
      </div>
    </AppShell>
  );
}
