"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Card, PageHeader } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { authFetch } from "@/lib/api-client";
import { getOwned } from "@/lib/client-data";
import { COLLECTIONS } from "@/lib/collections";
import { friendlyFirebaseError } from "@/lib/errors";
import type { StudyDocument } from "@/lib/types";

export function DocumentScreen({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [document, setDocument] = useState<StudyDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!user) return;
    getOwned<StudyDocument>(COLLECTIONS.documents, id, user.uid)
      .then((item) => {
        if (!item) setError("That document was not found.");
        else setDocument(item);
      })
      .catch((err) => setError(friendlyFirebaseError(err)));
  }, [user, id]);

  async function remove() {
    if (!window.confirm("Delete this document and the notes, decks, and quizzes made from it?")) return;
    setWorking(true);
    try {
      await authFetch(`/api/documents/${id}`, { method: "DELETE" });
      router.push("/app/documents");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the document.");
      setWorking(false);
    }
  }

  if (error) return <Alert>{error}</Alert>;
  if (!document) return <p className="text-sm text-muted">Loading document…</p>;
  return (
    <>
      <PageHeader title={document.title} lede={`${document.sourceType.toUpperCase()} · ${document.charCount.toLocaleString()} characters saved${document.textTruncated ? ` · the original extract was ${document.extractedCharCount.toLocaleString()} characters and was cut to fit storage` : ""}`} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href={`/app/notes/new?document=${document.id}`} className="rounded-full bg-pine px-4 py-2.5 text-sm font-medium text-white">Make notes</Link>
        <Link href={`/app/flashcards/new?document=${document.id}`} className="rounded-full border border-line bg-card px-4 py-2.5 text-sm">Make flashcards</Link>
        <Link href={`/app/quizzes/new?document=${document.id}`} className="rounded-full border border-line bg-card px-4 py-2.5 text-sm">Make a quiz</Link>
        <Button variant="danger" disabled={working} onClick={remove}>Delete</Button>
      </div>
      <Card>
        <h2 className="font-display text-2xl">Extracted text</h2>
        <p className="mt-2 text-sm text-muted">This is the text StudyPilot stored. Generation may use only the first part of it, and the result will say so.</p>
        <pre className="mt-4 max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-2xl bg-paper p-4 text-sm leading-6">{document.text.slice(0, 8000)}{document.text.length > 8000 ? "\n\n… showing the first 8,000 characters." : ""}</pre>
      </Card>
    </>
  );
}
