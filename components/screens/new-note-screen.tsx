"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, Field, PageHeader, fieldClass } from "@/components/ui";
import { useAccount } from "@/components/use-account";
import { authFetch } from "@/lib/api-client";
import { listOwned } from "@/lib/client-data";
import { COLLECTIONS } from "@/lib/collections";
import { friendlyFirebaseError } from "@/lib/errors";
import { NOTE_STYLES } from "@/lib/plans";
import type { NoteStyle, StudyDocument } from "@/lib/types";

export function NewNoteScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, limits } = useAccount();
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [documentId, setDocumentId] = useState(params.get("document") || "");
  const [style, setStyle] = useState<NoteStyle>("short");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!user) return;
    listOwned<StudyDocument>(COLLECTIONS.documents, user.uid).then(setDocuments).catch((err) => setError(friendlyFirebaseError(err)));
  }, [user]);

  async function generate() {
    if (!user?.emailVerified) return setError("Verify your email before generating notes.");
    if (!documentId) return setError("Choose a document.");
    setWorking(true);
    setError(null);
    try {
      const result = await authFetch<{ id: string }>("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, style }),
      });
      router.push(`/app/notes/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Notes could not be generated.");
      setWorking(false);
    }
  }

  return (
    <>
      <PageHeader title="New notes" lede="Pick a document and a style. The note is saved when generation succeeds." />
      {error ? <div className="mb-4"><Alert>{error}</Alert></div> : null}
      <div className="space-y-4">
        <Field label="Document">
          <select className={fieldClass} value={documentId} onChange={(event) => setDocumentId(event.target.value)}>
            <option value="">Choose a document</option>
            {documents.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </Field>
        <div className="grid gap-3 md:grid-cols-2">
          {NOTE_STYLES.map((item) => {
            const allowed = limits.noteStyles.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                disabled={!allowed}
                onClick={() => setStyle(item.id)}
                className={`rounded-3xl border p-4 text-left ${style === item.id ? "border-pine bg-[#f3f8f6]" : "border-line bg-card"} disabled:opacity-60`}
              >
                <span className="font-medium">{item.label}</span>
                {!allowed ? <span className="ml-2 text-xs text-gold">Student</span> : null}
                <p className="mt-1 text-sm text-muted">{item.description}</p>
              </button>
            );
          })}
        </div>
        <Button disabled={working} onClick={generate}>{working ? "Writing notes…" : "Generate notes"}</Button>
      </div>
    </>
  );
}
