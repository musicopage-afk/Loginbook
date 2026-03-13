import { AppShell } from "@/components/app-shell";

export default function ForbiddenPage() {
  return (
    <AppShell>
      <div className="card">
        <h1>Forbidden</h1>
        <p className="muted">Your role does not permit this action.</p>
      </div>
    </AppShell>
  );
}
