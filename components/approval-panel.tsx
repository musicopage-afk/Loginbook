"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getCsrfTokenFromDocument } from "@/lib/client-security";

export function ApprovalPanel({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  async function approve() {
    setError("");
    const response = await fetch(`/api/entries/${entryId}/approve`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": getCsrfTokenFromDocument()
      },
      body: JSON.stringify({ note })
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? "Could not approve the entry");
      return;
    }

    router.refresh();
  }

  return (
    <div className="stack">
      <label>
        Approval note
        <textarea value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      {error ? <div className="danger">{error}</div> : null}
      <button className="primary" type="button" onClick={approve}>Approve and lock entry</button>
    </div>
  );
}
