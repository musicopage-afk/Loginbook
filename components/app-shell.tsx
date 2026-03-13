import Link from "next/link";
import { User } from "@prisma/client";
import { BrandLogo } from "@/components/brand-logo";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { LogoutButton } from "@/components/logout-button";
import { ShellSidebar } from "@/components/shell-sidebar";
import { canManageAccounts, canViewAudit } from "@/lib/rbac";

export function AppShell({
  user,
  children
}: {
  user?: Pick<User, "displayName" | "role">;
  children: React.ReactNode;
}) {
  const roleLabel = user ? `${user.role.slice(0, 1)}${user.role.slice(1).toLowerCase()} User` : null;
  const navItems = [
    ...(user ? [{ href: "/logbooks", label: "Log Book" }] : []),
    ...(user ? [{ href: "/current-people", label: "In Building" }] : []),
    ...(user && canViewAudit(user.role) ? [{ href: "/audit", label: "Audit" }] : []),
    ...(user && canManageAccounts(user.role) ? [{ href: "/accounts", label: "Accounts" }] : [])
  ];

  return (
    <main className="shell">
      <ShellSidebar items={navItems}>
        <div className="topbar">
          <div>
            <Link className="brand brand-link" href="/">
              <BrandLogo />
            </Link>
            <div className="muted">Digital logbook with audit-grade history</div>
            {roleLabel ? <div className="topbar-user-pill"><span className="pill">{roleLabel}</span></div> : null}
          </div>
          <div className="topbar-actions">
            {user ? <LogoutButton /> : <Link className="button topbar-button" href="/login">Login</Link>}
          </div>
        </div>
        <Breadcrumbs />
        {children}
      </ShellSidebar>
    </main>
  );
}
