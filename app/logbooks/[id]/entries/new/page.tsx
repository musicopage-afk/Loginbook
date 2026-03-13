import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { EntryForm } from "@/components/entry-form";
import { requirePageUser } from "@/lib/server-auth";
import { listActiveEntryNames } from "@/lib/services/entries";

export const dynamic = "force-dynamic";

export default async function CreateEntryPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageUser(UserRole.CONTRIBUTOR);
  const { id } = await params;
  const activeNameSuggestions = await listActiveEntryNames(user.organizationId, id);

  return (
    <AppShell user={user}>
      <section className="card">
        <h1>Create log</h1>
        <EntryForm logbookId={id} activeNameSuggestions={activeNameSuggestions} />
      </section>
    </AppShell>
  );
}
