"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getCsrfTokenFromDocument } from "@/lib/client-security";

export function CreateLogbookForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/logbooks", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": getCsrfTokenFromDocument()
      },
      body: JSON.stringify({
        name: form.get("name"),
        type: form.get("type")
      })
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? "Could not create the logbook");
      return;
    }

    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      <label>
        Name
        <input name="name" required maxLength={120} />
      </label>
      <label>
        Type
        <input name="type" required maxLength={60} />
      </label>
      {error ? <div className="danger">{error}</div> : null}
      <button className="primary" type="submit">Create logbook</button>
    </form>
  );
}
