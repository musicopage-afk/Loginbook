import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { OfflineSync } from "@/components/offline-sync";
import { requirePageUser } from "@/lib/server-auth";
import { listLogbooks } from "@/lib/services/logbooks";

export const dynamic = "force-dynamic";

export default async function LogbooksPage() {
  const user = await requirePageUser(UserRole.READER);
  const logbooks = await listLogbooks(user.organizationId);
  const logbook = logbooks[0];

  if (!logbook) {
    return (
      <AppShell user={user}>
        <OfflineSync />
        <section className="card">
          <div className="empty">No log book available.</div>
        </section>
      </AppShell>
    );
  }

  redirect(`/logbooks/${logbook.id}`);
}
