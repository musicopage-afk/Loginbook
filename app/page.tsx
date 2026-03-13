import Link from "next/link";
import { getCurrentSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { canManageAccounts, canViewAudit } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getCurrentSession();
  const user = session?.user;
  const roleLabel = user ? `${user.role.slice(0, 1)}${user.role.slice(1).toLowerCase()}` : "Staff";

  return (
    <AppShell user={user ?? undefined}>
      <section className="home-stage">
        <section className="card home-hero">
          <div className="home-copy">
            <span className="home-kicker">Internal operations workspace</span>
            <h1>Clear records, smooth access, complete accountability.</h1>
            <p className="muted home-intro">
              This workspace is designed for a single team managing day-to-day entry and exit records. The focus is
              speed at the desk, clean readback, and dependable accountability rather than public product marketing.
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
          <div className="home-panel home-panel-primary">
            <div className="home-panel-header">
              <span className="home-metric-label">Current mode</span>
              <span className="home-status-dot" aria-hidden="true" />
            </div>
            <strong className="home-panel-title">{user ? `${roleLabel} control view` : "Secure company sign-in"}</strong>
            <p className="muted">
              {user
                ? "Your core actions remain visible here so the homepage works like an internal control surface, not a brochure."
                : "Use your company account name and password to enter the internal log workspace and review access records."}
            </p>
            <div className="home-stat-grid">
              <div className="home-stat-card">
                <span className="home-metric-label">Workspace</span>
                <strong>Single shared log book</strong>
              </div>
              <div className="home-stat-card">
                <span className="home-metric-label">Role view</span>
                <strong>{user ? roleLabel : "Authenticated staff only"}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="grid two home-grid">
          <article className="card home-section-card">
            <div className="home-section-heading">
              <span className="home-metric-label">Daily flow</span>
              <h2>Designed for the desk, not for demos</h2>
            </div>
            <div className="home-checklist">
              <div className="home-check">
                <strong>Review the live log</strong>
                <span className="muted">See active, past, and inactive entries in one place without extra navigation noise.</span>
              </div>
              <div className="home-check">
                <strong>Create records quickly</strong>
                <span className="muted">Capture direction, company, reason, authorization, and timestamp in one clear flow.</span>
              </div>
              <div className="home-check">
                <strong>Keep oversight nearby</strong>
                <span className="muted">Audit history and account management stay accessible without dominating the page.</span>
              </div>
            </div>
          </article>

          <article className="card home-section-card home-preview-card">
            <div className="home-section-heading">
              <span className="home-metric-label">Workspace summary</span>
              <h2>Everything important stays readable</h2>
            </div>
            <div className="home-preview-list" aria-label="Internal workflow summary">
              <div className="home-preview-row">
                <span className="home-preview-label">Authentication</span>
                <span className="home-preview-value">Username and password</span>
              </div>
              <div className="home-preview-row">
                <span className="home-preview-label">Record types</span>
                <span className="home-preview-value">Entry and exit logs</span>
              </div>
              <div className="home-preview-row">
                <span className="home-preview-label">Log states</span>
                <span className="home-preview-value">Active, Past, Inactive</span>
              </div>
              <div className="home-preview-row">
                <span className="home-preview-label">Accountability</span>
                <span className="home-preview-value">Readable role-based audit trail</span>
              </div>
            </div>
          </article>
        </section>
      </section>
    </AppShell>
  );
}
