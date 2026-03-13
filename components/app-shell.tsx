import Link from "next/link";
import { User } from "@prisma/client";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LogoutButton } from "@/components/logout-button";
import { canManageAccounts, canViewAudit } from "@/lib/rbac";

export function AppShell({
  user,
  children
}: {
  user?: Pick<User, "displayName" | "role">;
  children: React.ReactNode;
}) {
  const roleLabel = user ? `${user.role.slice(0, 1)}${user.role.slice(1).toLowerCase()} User` : null;

  return (
    <main className="shell">
      <div className="topbar">
        <div>
          <Link className="brand brand-link" href="/">
            LoginBook
          </Link>
          <div className="muted">Digital logbook with audit-grade history</div>
          {roleLabel ? <div className="topbar-user-pill"><span className="pill">{roleLabel}</span></div> : null}
        </div>
        <div className="nav">
          <Link className="button topbar-button" href="/logbooks">Log Book</Link>
          {user && canViewAudit(user.role) ? <Link className="button topbar-button" href="/audit">Audit</Link> : null}
          {user && canManageAccounts(user.role) ? <Link className="button topbar-button" href="/accounts">Accounts</Link> : null}
          {user ? <LogoutButton /> : <Link className="button topbar-button" href="/login">Login</Link>}
        </div>
      </div>
      <Breadcrumbs />
      {children}
    </main>
  );
}
