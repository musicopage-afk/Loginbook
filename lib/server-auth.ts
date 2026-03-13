import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";

export async function requirePageUser(minimumRole?: UserRole) {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  if (minimumRole && !hasRole(session.user.role, minimumRole)) {
    redirect("/forbidden");
  }

  return session.user;
}
