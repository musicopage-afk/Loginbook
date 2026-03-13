import Link from "next/link";
import { getCurrentSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { canManageAccounts, canViewAudit } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getCurrentSession();
  const user = session?.user;

  return (
    <AppShell user={user ?? undefined}>
      <section className="card home-hero">
        <div className="home-copy">
          <span className="pill">Live log tracking</span>
          <h1>Clear, fast visitor and access logging from one place.</h1>
          <p className="muted home-intro">
            LoginBook keeps entries readable, searchable, and accountable without making everyday check-ins slow.
          </p>
          <div className="home-actions">
            {user ? (
              <>
                <Link className="button primary" href="/logbooks">
                  Open Log Book
                </Link>
                {canViewAudit(user.role) ? (
                  <Link className="button" href="/audit">
                    Review Audit
                  </Link>
                ) : null}
                {canManageAccounts(user.role) ? (
                  <Link className="button" href="/accounts">
                    Manage Accounts
                  </Link>
                ) : null}
              </>
            ) : (
              <>
                <Link className="button primary" href="/login">
                  Sign In
                </Link>
                <Link className="button" href="/logbooks">
                  View Log Book
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="home-panel">
          <div className="home-metric">
            <span className="home-metric-label">Designed for</span>
            <strong>Reception desks, staff entry points, and controlled access logs</strong>
          </div>
          <div className="home-metric">
            <span className="home-metric-label">Built around</span>
            <strong>simple account sign-in, readable logs, and durable audit history</strong>
          </div>
          <div className="home-metric">
            <span className="home-metric-label">Best next step</span>
            <strong>{user ? "Open the Log Book to create or review entries." : "Sign in with your account name and password."}</strong>
          </div>
        </div>
      </section>

      <section className="grid two">
        <article className="card">
          <h2>Simple daily workflow</h2>
          <p className="muted">
            Create logs, review active and past entries, and keep each record easy to understand at a glance.
          </p>
        </article>
        <article className="card">
          <h2>Controlled access</h2>
          <p className="muted">
            Role-based accounts and audit visibility keep changes attributable without cluttering the interface.
          </p>
        </article>
      </section>
    </AppShell>
  );
}
