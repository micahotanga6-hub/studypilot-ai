"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, Card, PageHeader } from "@/components/ui";
import { UsageMeters } from "@/components/usage-meters";
import { useAccount } from "@/components/use-account";
import { listOwned } from "@/lib/client-data";
import { COLLECTIONS } from "@/lib/collections";
import { friendlyFirebaseError } from "@/lib/errors";
import { formatWhen } from "@/lib/format";
import type { StudyDocument, SummaryRecord } from "@/lib/types";

export function DashboardScreen() {
  const { user, profile, plan, limits, usage, accountError } = useAccount();
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [notes, setNotes] = useState<SummaryRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    listOwned<StudyDocument>(COLLECTIONS.documents, user.uid).then(setDocuments).catch((err) => setError(friendlyFirebaseError(err)));
    listOwned<SummaryRecord>(COLLECTIONS.summaries, user.uid).then(setNotes).catch((err) => setError(friendlyFirebaseError(err)));
    fetch("/api/health").then((response) => response.json()).then((data) => setMissing(data.missingServer || [])).catch(() => undefined);
  }, [user]);

  const name = profile?.displayName || user?.displayName || "there";
  return (
    <>
      <PageHeader title={`Hello, ${name}`} lede={`You are on the ${limits.label} plan. The counts below come from this month's saved activity.`} action={<Link href="/app/documents" className="rounded-full bg-pine px-4 py-2.5 text-sm font-medium text-white">Add material</Link>} />
      {accountError ? <Alert>{accountError}</Alert> : null}
      {error ? <div className="mb-4"><Alert>{error}</Alert></div> : null}
      {missing.length > 0 ? (
        <div className="mb-4">
          <Alert tone="info">
            The server is missing {missing.join(", ")}. AI and file saving that need those values will explain the gap instead of failing silently.
          </Alert>
        </div>
      ) : null}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl">This month</h2>
          <span className="rounded-full bg-paper-deep px-3 py-1 text-xs font-medium uppercase tracking-wide">{plan}</span>
        </div>
        <UsageMeters usage={usage} limits={limits} />
      </Card>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-display text-2xl">Recent documents</h2>
          {documents.length === 0 ? <p className="mt-3 text-sm text-muted">No documents yet. Upload one to start.</p> : (
            <ul className="mt-3 space-y-2 text-sm">
              {documents.slice(0, 4).map((item) => (
                <li key={item.id}><Link href={`/app/documents/${item.id}`} className="underline decoration-line underline-offset-4">{item.title}</Link> <span className="text-muted">{formatWhen(item.createdAtMs)}</span></li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="font-display text-2xl">Recent notes</h2>
          {notes.length === 0 ? <p className="mt-3 text-sm text-muted">Notes you generate will show up here.</p> : (
            <ul className="mt-3 space-y-2 text-sm">
              {notes.slice(0, 4).map((item) => (
                <li key={item.id}><Link href={`/app/notes/${item.id}`} className="underline decoration-line underline-offset-4">{item.title}</Link></li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
