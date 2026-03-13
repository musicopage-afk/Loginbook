"use client";

import { useEffect, useState } from "react";
import { OFFLINE_CONFLICT_KEY, OFFLINE_QUEUE_KEY } from "@/lib/constants";
import { getCsrfTokenFromDocument } from "@/lib/client-security";

type OfflineItem = {
  id: string;
  logbookId: string;
  title: string;
  body: string;
  occurredAt: string;
  tags: string[];
  structuredFieldsJson: Record<string, unknown>;
  supersedesEntryId?: string;
};

type Conflict = {
  id: string;
  reason: string;
  title: string;
};

export function OfflineSync() {
  const [pending, setPending] = useState(0);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  useEffect(() => {
    function loadState() {
      setPending(JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) ?? "[]").length);
      setConflicts(JSON.parse(localStorage.getItem(OFFLINE_CONFLICT_KEY) ?? "[]") as Conflict[]);
    }

    async function flushQueue() {
      if (!navigator.onLine) {
        return;
      }

      const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) ?? "[]") as OfflineItem[];
      const nextQueue: OfflineItem[] = [];
      const nextConflicts: Conflict[] = [];

      for (const item of queue) {
        const response = await fetch(`/api/logbooks/${item.logbookId}/entries`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-csrf-token": getCsrfTokenFromDocument()
          },
          body: JSON.stringify(item)
        });

        if (response.ok) {
          continue;
        }

        const payload = (await response.json()) as { error?: string };
        if (response.status === 409) {
          nextConflicts.push({
            id: item.id,
            title: item.title,
            reason: payload.error ?? "Conflict"
          });
        } else {
          nextQueue.push(item);
        }
      }

      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(nextQueue));
      localStorage.setItem(OFFLINE_CONFLICT_KEY, JSON.stringify(nextConflicts));
      loadState();
    }

    loadState();
    void flushQueue();
    window.addEventListener("online", flushQueue);
    window.addEventListener("storage", loadState);

    return () => {
      window.removeEventListener("online", flushQueue);
      window.removeEventListener("storage", loadState);
    };
  }, []);

  if (!pending && conflicts.length === 0) {
    return null;
  }

  return (
    <div className="card">
      <h3>Offline sync</h3>
      <div className="muted">{pending} queued item(s) pending sync.</div>
      {conflicts.map((conflict) => (
        <div key={conflict.id} className="danger">
          Conflict for &quot;{conflict.title}&quot;: server remained authoritative and rejected the queued item. {conflict.reason}
        </div>
      ))}
    </div>
  );
}
