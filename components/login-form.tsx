"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getCsrfTokenFromDocument } from "@/lib/client-security";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": getCsrfTokenFromDocument()
      },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password")
      })
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Login failed");
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
