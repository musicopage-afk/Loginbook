"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getCsrfTokenFromDocument } from "@/lib/client-security";

export function DeleteLogbookButton({
  logbookId,
  logbookName
}: {
  logbookId: string;
  logbookName: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    if (!window.confirm(`Delete "${logbookName}"? This hides it from the active logbook list.`)) {
      return;
    }

    setDeleting(true);
    setError("");

    const response = await fetch(`/api/logbooks/${logbookId}`, {
      method: "DELETE",
      headers: {
        "x-csrf-token": getCsrfTokenFromDocument()
      }
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? "Could not delete the logbook");
      setDeleting(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="stack">
      <button type="button" onClick={onDelete} disabled={deleting}>
        {deleting ? "Deleting..." : "Delete"}
      </button>
      {error ? <div className="danger">{error}</div> : null}
    </div>
  );
}
