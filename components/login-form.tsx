"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCsrfTokenFromDocument } from "@/lib/client-security";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetch("/api/auth/csrf", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store"
    });
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    let csrfToken = getCsrfTokenFromDocument();
    if (!csrfToken) {
      const csrfResponse = await fetch("/api/auth/csrf", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store"
      });

      if (!csrfResponse.ok) {
        setError("Could not start secure sign-in. Refresh and try again.");
        setLoading(false);
        return;
      }

      csrfToken = getCsrfTokenFromDocument();
    }

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": csrfToken
      },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password")
      })
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Sign-in failed");
      setLoading(false);
      return;
    }

    router.push("/logbooks");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      <label>
        Email
        <input type="email" name="email" autoComplete="email" required />
      </label>
      <label>
        Password
        <input type="password" name="password" autoComplete="current-password" required />
      </label>
      {error ? <div className="danger">{error}</div> : null}
      <button className="primary" type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
