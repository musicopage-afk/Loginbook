import { UserRole } from "@prisma/client";
import { AccountManagement } from "@/components/account-management";
import { AppShell } from "@/components/app-shell";
import { requirePageUser } from "@/lib/server-auth";
import { listUsers } from "@/lib/services/users";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const user = await requirePageUser(UserRole.ADMIN);
  const users = await listUsers(user.organizationId);

  return (
    <AppShell user={user}>
      <AccountManagement
        users={users.map((item) => ({
          id: item.id,
          username: item.email,
          displayName: item.displayName,
          role: item.role,
          status: item.status
        }))}
      />
    </AppShell>
  );
}
