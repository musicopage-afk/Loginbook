import Link from "next/link";
import { User } from "@prisma/client";
import { canViewAudit } from "@/lib/rbac";
import { LogoutButton } from "@/components/logout-button";

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
          <Link href="/logbooks">Logbooks</Link>
          {user && canViewAudit(user.role) ? <Link href="/audit">Audit</Link> : null}
          {user ? <span className="pill">{user.displayName} · {user.role}</span> : null}
          {user ? <LogoutButton /> : <Link href="/login">Login</Link>}
        </div>
      </div>
      {children}
    </main>
  );
}
