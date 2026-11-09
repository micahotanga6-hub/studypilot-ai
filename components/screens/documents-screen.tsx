"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Card, Empty, Field, PageHeader, fieldClass } from "@/components/ui";
import { useAccount } from "@/components/use-account";
import { authFetch } from "@/lib/api-client";
import { listOwned } from "@/lib/client-data";
import { COLLECTIONS } from "@/lib/collections";
import { friendlyFirebaseError } from "@/lib/errors";
import { formatWhen } from "@/lib/format";
import { formatBytes } from "@/lib/plans";
import type { StudyDocument } from "@/lib/types";

export function DocumentsScreen() {
  const router = useRouter();
  const { user, limits } = useAccount();
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState<"file" | "paste" | null>(null);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) return;
    listOwned<StudyDocument>(COLLECTIONS.documents, user.uid)
      .then(setDocuments)
      .catch((err) => setError(friendlyFirebaseError(err)));
  }, [user]);

  async function uploadFile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return setError("Choose a file.");
    if (!user?.emailVerified) return setError("Verify your email before uploading.");
    setWorking("file");
    setError(null);
    try {
      const form = new FormData(event.currentTarget);
      const body = new FormData();
      body.set("file", file);
      body.set("title", String(form.get("title") || ""));
      const result = await authFetch<{ id: string }>("/api/documents", { method: "POST", body });
      router.push(`/app/documents/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setWorking(null);
    }
  }

  async function pasteText(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user?.emailVerified) return setError("Verify your email before saving text.");
    const form = new FormData(event.currentTarget);
    setWorking("paste");
    setError(null);
    try {
      const result = await authFetch<{ id: string }>("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.get("title"), text: form.get("text") }),
      });
      router.push(`/app/documents/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The text could not be saved.");
    } finally {
      setWorking(null);
    }
  }

  return (
    <>
      <PageHeader title="My Documents" lede={`PDF, DOCX, TXT, or pasted text. The ${limits.label} plan accepts files up to ${formatBytes(limits.maxUploadBytes)}.`} />
      {error ? <div className="mb-4"><Alert>{error}</Alert></div> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-2xl">Upload a file</h2>
          <form onSubmit={uploadFile} className="mt-4 space-y-4">
            <Field label="Title" hint="Optional. The file name is used if you leave this blank."><input name="title" maxLength={160} className={fieldClass} /></Field>
            <Field label="File">
              <input
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,text/plain"
                className="block w-full text-sm"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </Field>
            <Button type="submit" disabled={working !== null}>{working === "file" ? "Reading the file…" : "Upload"}</Button>
          </form>
        </Card>
        <Card>
          <h2 className="font-display text-2xl">Paste text</h2>
          <form onSubmit={pasteText} className="mt-4 space-y-4">
            <Field label="Title"><input name="title" maxLength={160} className={fieldClass} /></Field>
            <Field label="Text"><textarea name="text" required minLength={40} rows={8} className={fieldClass} placeholder="Paste a section of your notes." /></Field>
            <Button type="submit" disabled={working !== null}>{working === "paste" ? "Saving…" : "Save text"}</Button>
          </form>
        </Card>
      </div>
      <div className="mt-6">
        {documents.length === 0 ? <Empty title="No documents yet" body="Upload a file or paste text. If a PDF is a scan, StudyPilot will say it could not read it." /> : (
          <ul className="divide-y divide-line rounded-3xl border border-line bg-card">
            {documents.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <Link href={`/app/documents/${item.id}`} className="font-medium underline decoration-line underline-offset-4">{item.title}</Link>
                  <p className="text-xs text-muted">{item.sourceType.toUpperCase()} · {item.charCount.toLocaleString()} characters · {formatWhen(item.createdAtMs)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
