"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getCsrfTokenFromDocument } from "@/lib/client-security";

type ManagedUser = {
  id: string;
  username: string;
  role: string;
  status: string;
};

const roleOptions = ["READER", "CONTRIBUTOR", "EDITOR", "APPROVER", "AUDITOR", "ADMIN"] as const;

export function AccountManagement({
  users,
  currentUserId
}: {
  users: ManagedUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onCreate(formData: FormData) {
    setError("");
    setLoading(true);

    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": getCsrfTokenFromDocument()
      },
      body: JSON.stringify({
        username: formData.get("username"),
        password: formData.get("password"),
        role: formData.get("role")
      })
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? "Could not create account");
      setLoading(false);
      return;
    }

    router.refresh();
  }

  async function toggleStatus(id: string, status: string) {
    setError("");
    const response = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": getCsrfTokenFromDocument()
      },
      body: JSON.stringify({
        status
      })
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? "Could not update account");
      return;
    }

    router.refresh();
  }

  return (
    <div className="grid two">
      <section className="card">
        <h1>Accounts</h1>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void onCreate(new FormData(event.currentTarget));
          }}
        >
          <label>
            Username
            <input name="username" required maxLength={60} />
          </label>
          <label>
            Password
            <input name="password" type="password" required minLength={8} />
          </label>
          <label>
            Role
            <select name="role" defaultValue="CONTRIBUTOR">
              {roleOptions.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </label>
          {error ? <div className="danger">{error}</div> : null}
          <button className="primary" type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>
      </section>
      <section className="card">
        <h2>Manage accounts</h2>
        <div className="account-list">
          {users.map((user) => (
            <div key={user.id} className="account-row">
              <div className="account-copy">
                <strong>{user.username}</strong>
                <span className="muted">{user.role} / {user.status}</span>
              </div>
              {user.id === currentUserId ? (
                <span className="muted">Current account</span>
              ) : (
                <button
                  type="button"
                  className={user.status === "ACTIVE" ? "button action-delete" : "button action-view"}
                  onClick={() => void toggleStatus(user.id, user.status === "ACTIVE" ? "DISABLED" : "ACTIVE")}
                >
                  {user.status === "ACTIVE" ? "Disable" : "Enable"}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
