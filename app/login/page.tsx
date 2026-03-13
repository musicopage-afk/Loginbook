import { AppShell } from "@/components/app-shell";
import { LoginForm } from "@/components/login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  return (
    <AppShell loggedOutAction="home">
      <div className="grid two">
        <section className="card hero">
          <h1>Operational log book with durable history</h1>
          <p className="muted">
            Record entries and exports with tenant isolation, append-only audit events and
            server-enforced roles.
          </p>
          <div className="stack">
            <span className="pill">Cookie sessions + CSRF protection</span>
            <span className="pill">Argon2 password hashing</span>
          </div>
        </section>
        <section className="card">
          <h2>Sign in</h2>
          <LoginForm />
        </section>
      </div>
    </AppShell>
  );
}
