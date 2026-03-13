import Link from "next/link";
import { User } from "@prisma/client";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LogoutButton } from "@/components/logout-button";
import { canViewAudit } from "@/lib/rbac";

export function AppShell({
  user,
  children
}: {
  user?: Pick<User, "displayName" | "role">;
  children: React.ReactNode;
}) {
  return (
    <main className="shell">
      <div className="topbar">
        <div>
          <div className="brand">LoginBook</div>
          <div className="muted">Digital logbook with audit-grade history</div>
        </div>
        <div className="nav">
          <Link href="/logbooks">Log Book</Link>
          {user && canViewAudit(user.role) ? <Link href="/audit">Audit</Link> : null}
          {user ? <span className="pill">{user.displayName} / {user.role}</span> : null}
          {user ? <LogoutButton /> : <Link href="/login">Login</Link>}
        </div>
      </div>
      <Breadcrumbs />
      {children}
    </main>
  );
}
