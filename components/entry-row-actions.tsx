"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getCsrfTokenFromDocument } from "@/lib/client-security";

export function EntryRowActions({ entryId, entryName }: { entryId: string; entryName: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    setDeleting(true);
    setError("");

    const response = await fetch(`/api/entries/${entryId}`, {
      method: "DELETE",
      headers: {
        "x-csrf-token": getCsrfTokenFromDocument()
      }
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? "Could not delete the log");
      setDeleting(false);
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <div className="entry-actions">
        <Link className="button action-button action-view" href={`/entries/${entryId}`}>
          View
        </Link>
        <Link className="button action-button action-edit" href={`/entries/${entryId}/edit`}>
          Edit
        </Link>
        <button className="action-button action-delete" type="button" onClick={() => setOpen(true)}>
          Delete
        </button>
      </div>
      {open ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby={`delete-log-${entryId}`}>
            <h2 id={`delete-log-${entryId}`}>Are you sure?</h2>
            <p className="muted">This will remove &quot;{entryName}&quot; from the log list.</p>
            {error ? <div className="danger">{error}</div> : null}
            <div className="modal-actions">
              <button className="button ghost-button" type="button" onClick={() => setOpen(false)} disabled={deleting}>
                Cancel
              </button>
              <button className="button modal-delete-button" type="button" onClick={onDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
