"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MarkdownView } from "@/components/markdown-view";
import { Alert, Button, PageHeader, fieldClass } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { getOwned, removeOwned, saveFields } from "@/lib/client-data";
import { COLLECTIONS } from "@/lib/collections";
import { friendlyFirebaseError } from "@/lib/errors";
import { downloadFile } from "@/lib/format";
import { NOTE_STYLES } from "@/lib/plans";
import { markdownToText, slugify } from "@/lib/text";
import type { SummaryRecord } from "@/lib/types";

export function NoteScreen({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [note, setNote] = useState<SummaryRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!user) return;
    getOwned<SummaryRecord>(COLLECTIONS.summaries, id, user.uid)
      .then((item) => {
        if (!item) {
          setError("Those notes were not found.");
          return;
        }
        setNote(item);
        setTitle(item.title);
        setMarkdown(item.markdown);
      })
      .catch((err) => setError(friendlyFirebaseError(err)));
  }, [user, id]);

  async function save() {
    setWorking(true);
    setError(null);
    try {
      await saveFields(COLLECTIONS.summaries, id, { title: title.trim(), markdown, updatedAtMs: Date.now() });
      setNote((current) => current ? { ...current, title: title.trim(), markdown, updatedAtMs: Date.now() } : current);
      setEditing(false);
    } catch (err) {
      setError(friendlyFirebaseError(err));
    } finally {
      setWorking(false);
    }
  }

  async function remove() {
    if (!window.confirm("Delete these notes?")) return;
    await removeOwned(COLLECTIONS.summaries, id);
    router.push("/app/notes");
  }

  if (error) return <Alert>{error}</Alert>;
  if (!note) return <p className="text-sm text-muted">Loading notes…</p>;
  const style = NOTE_STYLES.find((item) => item.id === note.style)?.label || note.style;
  const file = slugify(title || note.title);
  return (
    <>
      <PageHeader title={editing ? "Edit notes" : note.title} lede={`${style} · from ${note.documentTitle}. ${note.sourceCharsUsed < note.sourceCharsTotal ? `Covers the first ${note.sourceCharsUsed.toLocaleString()} of ${note.sourceCharsTotal.toLocaleString()} characters.` : `Uses the full saved text (${note.sourceCharsTotal.toLocaleString()} characters).`}`} />
      <div className="no-print mb-4 flex flex-wrap gap-2">
        {editing ? (
          <>
            <Button disabled={working} onClick={save}>{working ? "Saving…" : "Save"}</Button>
            <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
          </>
        ) : (
          <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
        )}
        <Button variant="secondary" onClick={() => downloadFile(`${file}.md`, markdown || note.markdown, "text/markdown")}>Export Markdown</Button>
        <Button variant="secondary" onClick={() => downloadFile(`${file}.txt`, markdownToText(markdown || note.markdown), "text/plain")}>Export text</Button>
        <Button variant="ghost" onClick={() => window.print()}>Print</Button>
        <Button variant="danger" onClick={remove}>Delete</Button>
      </div>
      {editing ? (
        <div className="space-y-3">
          <input value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClass} maxLength={180} />
          <textarea value={markdown} onChange={(event) => setMarkdown(event.target.value)} rows={18} className={fieldClass} />
        </div>
      ) : (
        <article className="rounded-3xl border border-line bg-card p-6">
          <MarkdownView markdown={note.markdown} />
        </article>
      )}
    </>
  );
}
