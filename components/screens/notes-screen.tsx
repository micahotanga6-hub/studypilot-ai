"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Empty, PageHeader, Alert } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { listOwned } from "@/lib/client-data";
import { COLLECTIONS } from "@/lib/collections";
import { friendlyFirebaseError } from "@/lib/errors";
import { formatWhen } from "@/lib/format";
import { NOTE_STYLES } from "@/lib/plans";
import type { SummaryRecord } from "@/lib/types";

export function NotesScreen() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<SummaryRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    listOwned<SummaryRecord>(COLLECTIONS.summaries, user.uid).then(setNotes).catch((err) => setError(friendlyFirebaseError(err)));
  }, [user]);
  const label = (style: string) => NOTE_STYLES.find((item) => item.id === style)?.label || style;
  return (
    <>
      <PageHeader title="AI Summaries" lede="Notes saved from your documents. Open one to read, edit, export, or delete it." action={<Link href="/app/notes/new" className="rounded-full bg-pine px-4 py-2.5 text-sm font-medium text-white">New notes</Link>} />
      {error ? <Alert>{error}</Alert> : null}
      {notes.length === 0 ? <Empty title="No notes yet" body="Generate a summary from a document you have uploaded." /> : (
        <ul className="divide-y divide-line rounded-3xl border border-line bg-card">
          {notes.map((note) => (
            <li key={note.id} className="px-5 py-4">
              <Link href={`/app/notes/${note.id}`} className="font-medium underline decoration-line underline-offset-4">{note.title}</Link>
              <p className="text-xs text-muted">{label(note.style)} · {note.documentTitle} · {formatWhen(note.createdAtMs)}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
