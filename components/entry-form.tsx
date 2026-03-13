"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatedSelect } from "@/components/animated-select";
import { OFFLINE_QUEUE_KEY } from "@/lib/constants";
import { type LogDirection } from "@/lib/entry-presentation";
import { getCsrfTokenFromDocument } from "@/lib/client-security";

type EntryFormValues = {
  name: string;
  entryOrExit: LogDirection;
  reason: string;
  authorisedBy: string;
  occurredAtIso: string;
};

export function EntryForm({
  logbookId,
  supersedesEntryId,
  entryId,
  initialValues,
  activeNameSuggestions = []
}: {
  logbookId: string;
  supersedesEntryId?: string;
  entryId?: string;
  initialValues?: EntryFormValues;
  activeNameSuggestions?: string[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [queued, setQueued] = useState(false);
  const [entryOrExit, setEntryOrExit] = useState<LogDirection>(initialValues?.entryOrExit ?? "ENTRY");
  const [name, setName] = useState(initialValues?.name ?? "");
  const isEditing = Boolean(entryId);

  useEffect(() => {
    if (entryOrExit !== "EXIT") {
      return;
    }

    if (!name.trim() && activeNameSuggestions.length > 0) {
      setName(activeNameSuggestions[0]);
    }
  }, [activeNameSuggestions, entryOrExit, name]);

  async function queueOffline(form: FormData) {
    const occurredAt = initialValues?.occurredAtIso ?? new Date().toISOString();
    const payload = {
      id: crypto.randomUUID(),
      logbookId,
      title: String(form.get("name") ?? ""),
      body: String(form.get("reason") ?? ""),
      occurredAt,
      tags: [],
      structuredFieldsJson: {
        entryOrExit: String(form.get("entryOrExit") ?? "ENTRY"),
        authorisedBy: String(form.get("authorisedBy") ?? ""),
        timestampGmt: occurredAt
      },
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
    const occurredAt = initialValues?.occurredAtIso ?? new Date().toISOString();
    const payload = {
      title: String(form.get("name") ?? ""),
      body: String(form.get("reason") ?? ""),
      occurredAt,
      tags: [],
      structuredFieldsJson: {
        entryOrExit: String(form.get("entryOrExit") ?? "ENTRY"),
        authorisedBy: String(form.get("authorisedBy") ?? ""),
        timestampGmt: occurredAt
      },
      supersedesEntryId
    };

    if (!navigator.onLine && !isEditing) {
      await queueOffline(form);
      event.currentTarget.reset();
      return;
    }

    const response = await fetch(isEditing ? `/api/entries/${entryId}` : `/api/logbooks/${logbookId}/entries`, {
      method: isEditing ? "PATCH" : "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": getCsrfTokenFromDocument()
      },
      body: JSON.stringify(payload)
    });

    const result = (await response.json()) as { error?: string; entry?: { id: string } };
    if (!response.ok || !result.entry) {
      setError(result.error ?? (isEditing ? "Could not update the log" : "Could not create the log"));
      return;
    }

    router.push(`/entries/${result.entry.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      <label>
        Name
        <input
          name="name"
          required
          maxLength={200}
          value={name}
          onChange={(event) => setName(event.target.value)}
          list={activeNameSuggestions.length > 0 ? "active-log-names" : undefined}
        />
      </label>
      <label>
        Entry or Exit
        <AnimatedSelect
          name="entryOrExit"
          label="Entry or Exit"
          value={entryOrExit}
          onChange={(value) => setEntryOrExit(value as LogDirection)}
          options={[
            { value: "ENTRY", label: "Entry" },
            { value: "EXIT", label: "Exit" }
          ]}
        />
      </label>
      <label>
        Reason
        <textarea className="textarea-medium" name="reason" required defaultValue={initialValues?.reason ?? ""} />
      </label>
      <label>
        Authorised by
        <input name="authorisedBy" required maxLength={120} defaultValue={initialValues?.authorisedBy ?? ""} />
      </label>
      {queued ? <div className="muted">Offline: log queued locally and will sync when online.</div> : null}
      {error ? <div className="danger">{error}</div> : null}
      {activeNameSuggestions.length > 0 ? (
        <datalist id="active-log-names">
          {activeNameSuggestions.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      ) : null}
      <button className="primary" type="submit">
        {isEditing ? "Save changes" : supersedesEntryId ? "Create superseding log" : "Create log"}
      </button>
    </form>
  );
}
