import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { EntryForm } from "@/components/entry-form";
import { requirePageUser } from "@/lib/server-auth";

export default async function CreateEntryPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageUser(UserRole.CONTRIBUTOR);
  const { id } = await params;

  return (
    <AppShell user={user}>
      <section className="card">
        <h1>Create entry</h1>
        <EntryForm logbookId={id} />
      </section>
    </AppShell>
  );
}
