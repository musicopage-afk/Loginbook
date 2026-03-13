"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCsrfTokenFromDocument } from "@/lib/client-security";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const resetFields = useCallback(() => {
    setUsername("");
    setPassword("");
    setError("");
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetch("/api/auth/csrf", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store"
    });
    resetFields();

    function handlePageShow() {
      resetFields();
    }

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("popstate", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("popstate", handlePageShow);
    };
  }, [resetFields]);

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

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": csrfToken
      },
      body: JSON.stringify({
        username,
        password
      })
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Sign-in failed");
      setLoading(false);
      return;
    }

    resetFields();
    router.push("/logbooks");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} autoComplete="off">
      <label>
        Username
        <input
          type="text"
          name="username"
          autoComplete="off"
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
      </label>
      <label>
        Password
        <input
          type="password"
          name="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {error ? <div className="danger">{error}</div> : null}
      <button className="primary" type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
