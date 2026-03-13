import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/server-auth";
import { getEntry } from "@/lib/services/entries";

export const dynamic = "force-dynamic";

export default async function EntryDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageUser(UserRole.READER);
  const { id } = await params;
  const entry = await getEntry(id, user.organizationId);

  if (!entry) {
    redirect("/logbooks");
  }

  redirect(`/logbooks/${entry.logbookId}`);
}
