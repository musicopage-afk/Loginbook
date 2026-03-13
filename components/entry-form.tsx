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
  company: string;
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
  const [entryOrExit, setEntryOrExit] = useState<LogDirection | "">(initialValues?.entryOrExit ?? "");
  const [name, setName] = useState(initialValues?.name ?? "");
  const [company, setCompany] = useState(initialValues?.company ?? "");
  const isEditing = Boolean(entryId);
  const isExit = entryOrExit === "EXIT";

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
    const selectedDirection = String(form.get("entryOrExit") ?? "ENTRY");
    const payload = {
      id: crypto.randomUUID(),
      logbookId,
      title: String(form.get("name") ?? ""),
      body: selectedDirection === "EXIT" ? "" : String(form.get("reason") ?? ""),
      occurredAt,
      tags: [],
      structuredFieldsJson: {
        entryOrExit: selectedDirection,
        authorisedBy: selectedDirection === "EXIT" ? "" : String(form.get("authorisedBy") ?? ""),
        company: selectedDirection === "EXIT" ? "" : String(form.get("company") ?? ""),
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
    const selectedDirection = String(form.get("entryOrExit") ?? "");

    if (!selectedDirection) {
      setError("Select entry or exit");
      return;
    }

    if (selectedDirection !== "EXIT") {
      if (!String(form.get("reason") ?? "").trim()) {
        setError("Reason is required");
        return;
      }

      if (!String(form.get("authorisedBy") ?? "").trim()) {
        setError("Authorised by is required");
        return;
      }

      if (!String(form.get("company") ?? "").trim()) {
        setError("Company is required");
        return;
      }
    }

    const payload = {
      title: String(form.get("name") ?? ""),
      body: selectedDirection === "EXIT" ? "" : String(form.get("reason") ?? ""),
      occurredAt,
      tags: [],
      structuredFieldsJson: {
        entryOrExit: selectedDirection,
        authorisedBy: selectedDirection === "EXIT" ? "" : String(form.get("authorisedBy") ?? ""),
        company: selectedDirection === "EXIT" ? "" : String(form.get("company") ?? ""),
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
    <form className="entry-form" onSubmit={onSubmit}>
      <label>
        Entry or Exit
        <AnimatedSelect
          name="entryOrExit"
          label="Entry or Exit"
          value={entryOrExit}
          placeholder="ENTRY OR EXIT"
          onChange={(value) => setEntryOrExit(value as LogDirection)}
          options={[
            { value: "ENTRY", label: "Entry" },
            { value: "EXIT", label: "Exit" }
          ]}
        />
      </label>
      <label>
        Name
        {isExit && activeNameSuggestions.length > 0 ? (
          <select name="name" required value={name} onChange={(event) => setName(event.target.value)}>
            <option value="">Select a person currently in the building</option>
            {activeNameSuggestions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        ) : (
          <input
            name="name"
            required
            maxLength={200}
            value={name}
            onChange={(event) => setName(event.target.value)}
            list={!isExit && activeNameSuggestions.length > 0 ? "active-log-names" : undefined}
          />
        )}
      </label>
      {isExit ? null : (
        <>
          <label>
            Reason
            <textarea className="textarea-medium" name="reason" required defaultValue={initialValues?.reason ?? ""} />
          </label>
          <label>
            Authorised by
            <input name="authorisedBy" required maxLength={120} defaultValue={initialValues?.authorisedBy ?? ""} />
          </label>
          <label>
            Company
            <input
              name="company"
              required
              maxLength={120}
              value={company}
              onChange={(event) => setCompany(event.target.value)}
            />
          </label>
        </>
      )}
      {queued ? <div className="muted">Offline: log queued locally and will sync when online.</div> : null}
      {error ? <div className="danger">{error}</div> : null}
      {!isExit && activeNameSuggestions.length > 0 ? (
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
