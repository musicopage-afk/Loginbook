import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { EntryForm } from "@/components/entry-form";
import { getLogFields } from "@/lib/entry-presentation";
import { requirePageUser } from "@/lib/server-auth";
import { getEntry, listActiveEntryNames } from "@/lib/services/entries";

export const dynamic = "force-dynamic";

export default async function EditEntryPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageUser(UserRole.EDITOR);
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
  const activeNameSuggestions = await listActiveEntryNames(user.organizationId, entry.logbookId, entry.id);

  return (
    <AppShell user={user}>
      <section className="card">
        <h1>Edit log</h1>
        <EntryForm
          logbookId={entry.logbookId}
          entryId={entry.id}
          initialValues={{
            name: fields.name,
            entryOrExit: fields.entryOrExit,
            reason: fields.reason,
            authorisedBy: fields.authorisedBy,
            company: fields.company,
            occurredAtIso: fields.occurredAtIso
          }}
          activeNameSuggestions={activeNameSuggestions}
        />
      </section>
    </AppShell>
  );
}
