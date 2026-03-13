import Link from "next/link";
import { getCurrentSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { BrandLogo } from "@/components/brand-logo";
import { canManageAccounts, canViewAudit } from "@/lib/rbac";

export const dynamic = "force-dynamic";

const featureCards = [
  {
    title: "Active Presence View",
    body: "See who is currently inside the building without searching through the full log list."
  },
  {
    title: "Fast Log Creation",
    body: "Capture entry, exit, company, authorization, and reason in one consistent flow."
  },
  {
    title: "Readable Audit History",
    body: "Review role-based account and log changes with direct, human-readable activity records."
  },
  {
    title: "Account Management",
    body: "Create, update, disable, and remove accounts from one place with immediate effect."
  },
  {
    title: "Structured Lifecycle Tags",
    body: "Active, Past, and Inactive states keep the log book easy to scan during busy desk work."
  },
  {
    title: "Focused Internal Design",
    body: "Built for one company’s internal operations instead of a broad public-facing product site."
  },
  {
    title: "Responsive Layout",
    body: "The interface stays clear on desktop and mobile without hiding key actions."
  },
  {
    title: "Secure Sign-In",
    body: "Username and password access keeps the workflow simple while preserving controlled entry."
  },
  {
    title: "Single Shared Log Book",
    body: "Everyone works from the same source of truth instead of managing multiple scattered books."
  }
] as const;

export default async function HomePage() {
  const session = await getCurrentSession();
  const user = session?.user;
  const roleLabel = user ? `${user.role.slice(0, 1)}${user.role.slice(1).toLowerCase()}` : "Staff";
  const primaryActionHref = user ? "/logbooks" : "/login";
  const primaryActionLabel = user ? "Open Log Book" : "Sign In";

  return (
    <AppShell user={user ?? undefined}>
      <section className="home-stage">
        <section className="card home-hero">
          <div className="home-copy">
            <span className="home-kicker">Internal operations workspace</span>
            <h1>
              Clear records for
              <span className="home-accent-line">Modern Workplace Access</span>
            </h1>
            <p className="muted home-intro">
              This workspace is designed for a single team managing day-to-day entry and exit records. The focus is
              speed at the desk, clean readback, and dependable accountability rather than public product marketing.
            </p>
            <div className="home-benefit-row">
              <span>Quick sign-in</span>
              <span>Immediate visibility</span>
              <span>Built for one company</span>
            </div>
            <div className="home-actions">
              <Link className="button primary" href={primaryActionHref}>
                {primaryActionLabel}
              </Link>
              {user ? (
                <>
                  <Link className="button" href="/current-people">
                    See Who&apos;s In
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
                <Link className="button" href="/logbooks">
                  View Log Book
                </Link>
              )}
            </div>
          </div>
          <div className="home-auth-card-wrap">
            <div className="home-auth-card">
              <div className="home-auth-tabs">
                <span className="home-auth-tab is-active">Login</span>
                <span className="home-auth-tab">Workspace</span>
              </div>
              <div className="home-auth-provider">Open the internal company workspace</div>
              <div className="home-auth-divider">Access with your account</div>
              <div className="home-auth-field">
                <label>Username</label>
                <div className="home-auth-input">{user ? "admin" : "your-company-user"}</div>
              </div>
              <div className="home-auth-field">
                <label>Password</label>
                <div className="home-auth-input">Secure password entry</div>
              </div>
              <Link className="button primary home-auth-button" href={primaryActionHref}>
                {primaryActionLabel}
              </Link>
              <div className="home-auth-footer">
                <div className="home-meta-card">
                  <span className="home-metric-label">Workspace</span>
                  <strong>Single shared log book</strong>
                </div>
                <div className="home-meta-card">
                  <span className="home-metric-label">Role view</span>
                  <strong>{user ? roleLabel : "Authenticated staff only"}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="home-feature-section">
          <div className="home-section-intro">
            <h2>Internal workplace management made simple</h2>
            <p className="muted">
              LoginBook keeps access tracking, presence visibility, and account control in one clean workspace for a
              single company team.
            </p>
          </div>
          <div className="home-feature-grid">
            {featureCards.map((feature, index) => (
              <article key={feature.title} className="card home-feature-card">
                <span className="home-feature-icon" aria-hidden="true">
                  {(index + 1).toString().padStart(2, "0")}
                </span>
                <h3>{feature.title}</h3>
                <p className="muted">{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-demo-section">
          <div className="home-section-intro">
            <h2>See LoginBook in action</h2>
            <p className="muted">
              A clean internal interface for reception desks, security points, and controlled workplace access.
            </p>
          </div>
          <div className="home-demo-shell">
            <div className="home-demo-side">
              <div className="home-demo-brand">
                <BrandLogo compact />
              </div>
              <div className="home-demo-nav-item is-active">Log Book</div>
              <div className="home-demo-nav-item">In Building</div>
              <div className="home-demo-nav-item">Accounts</div>
            </div>
            <div className="home-demo-main">
              <div className="home-demo-banner">
                <div>
                  <strong>No unresolved desk-side actions</strong>
                  <span>Everything needed for the current shift is visible in one place.</span>
                </div>
                <span className="home-demo-banner-button">Create log</span>
              </div>
              <div className="home-demo-heading">
                <h3>Current activity</h3>
                <div className="home-demo-pills">
                  <span>All</span>
                  <span>Active</span>
                  <span>Past</span>
                </div>
              </div>
              <div className="home-demo-grid">
                <div className="home-demo-panel is-highlighted">
                  <strong>Main Gate</strong>
                  <span>Active visitor log with company, reason, and authorization visible.</span>
                </div>
                <div className="home-demo-panel">
                  <strong>People in Building</strong>
                  <span>Live presence list backed by the same active log records.</span>
                </div>
                <div className="home-demo-panel">
                  <strong>Audit Feed</strong>
                  <span>Readable role-based changes for access logs and account updates.</span>
                </div>
                <div className="home-demo-panel">
                  <strong>Account Controls</strong>
                  <span>Create, edit, disable, and remove accounts from one administrative view.</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>
    </AppShell>
  );
}
