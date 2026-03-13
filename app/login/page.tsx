import { AppShell } from "@/components/app-shell";
import { LoginForm } from "@/components/login-form";
import { getOidcConfig } from "@/lib/oidc";
import { issueCsrfToken } from "@/lib/security";

export default async function LoginPage() {
  const oidc = getOidcConfig();
  await issueCsrfToken();

  return (
    <AppShell>
      <div className="grid two">
        <section className="card hero">
          <h1>Operational logbooks with durable history</h1>
          <p className="muted">
            Record entries, approvals and exports with tenant isolation, append-only audit events and
            server-enforced roles.
          </p>
          <div className="stack">
            <span className="pill">Cookie sessions + CSRF protection</span>
            <span className="pill">Argon2 password hashing</span>
            <span className="pill">OIDC configuration stub included</span>
          </div>
        </section>
        <section className="card">
          <h2>Sign in</h2>
          <LoginForm />
          <div className="muted">
            Enterprise SSO
            {oidc.enabled ? " is configured in environment variables." : " stub is present; set OIDC env vars to enable."}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
