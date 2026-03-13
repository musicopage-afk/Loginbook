"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { OFFLINE_QUEUE_KEY } from "@/lib/constants";
import { getCsrfTokenFromDocument } from "@/lib/client-security";

export function EntryForm({
  logbookId,
  supersedesEntryId
}: {
  logbookId: string;
  supersedesEntryId?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [queued, setQueued] = useState(false);

  async function queueOffline(form: FormData) {
    const payload = {
      id: crypto.randomUUID(),
      logbookId,
      title: String(form.get("title") ?? ""),
      body: String(form.get("body") ?? ""),
      occurredAt: new Date(String(form.get("occurredAt") ?? "")).toISOString(),
      tags: String(form.get("tags") ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      structuredFieldsJson: safeJson(String(form.get("structuredFieldsJson") ?? "{}")),
      supersedesEntryId
    };

    const existing = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) ?? "[]") as unknown[];
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify([...existing, payload]));
    setQueued(true);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setQueued(false);
    const form = new FormData(event.currentTarget);

    if (!navigator.onLine) {
      await queueOffline(form);
      event.currentTarget.reset();
      return;
    }

    const upload = new FormData();
    upload.set("title", String(form.get("title") ?? ""));
    upload.set("body", String(form.get("body") ?? ""));
    upload.set("occurredAt", new Date(String(form.get("occurredAt") ?? "")).toISOString());
    upload.set("tags", String(form.get("tags") ?? ""));
    upload.set("structuredFieldsJson", String(form.get("structuredFieldsJson") ?? "{}"));
    if (supersedesEntryId) {
      upload.set("supersedesEntryId", supersedesEntryId);
    }

    const filesInput = form.getAll("attachments");
    for (const item of filesInput) {
      if (item instanceof File && item.size > 0) {
        upload.append("attachments", item);
      }
    }

    const response = await fetch(`/api/logbooks/${logbookId}/entries`, {
      method: "POST",
      headers: {
        "x-csrf-token": getCsrfTokenFromDocument()
      },
      body: upload
    });

    const payload = (await response.json()) as { error?: string; entry?: { id: string } };
    if (!response.ok || !payload.entry) {
      setError(payload.error ?? "Could not create the entry");
      return;
    }

    router.push(`/entries/${payload.entry.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      <label>
        Title
        <input name="title" required maxLength={200} />
      </label>
      <label>
        Body
        <textarea name="body" required />
      </label>
      <label>
        Occurred at
        <input name="occurredAt" type="datetime-local" required />
      </label>
      <label>
        Tags
        <input name="tags" placeholder="handover, maintenance" />
      </label>
      <label>
        Structured fields JSON
        <textarea name="structuredFieldsJson" defaultValue="{}" />
      </label>
      <label>
        Attachments
        <input name="attachments" type="file" multiple />
      </label>
      {queued ? <div className="muted">Offline: entry queued locally and will sync when online.</div> : null}
      {error ? <div className="danger">{error}</div> : null}
      <button className="primary" type="submit">
        {supersedesEntryId ? "Create superseding entry" : "Create entry"}
      </button>
    </form>
  );
}

function safeJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}
