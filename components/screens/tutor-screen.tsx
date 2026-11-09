"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, Field, PageHeader, fieldClass } from "@/components/ui";
import { useAccount } from "@/components/use-account";
import { authFetch } from "@/lib/api-client";
import { listOwned, listWhere } from "@/lib/client-data";
import { COLLECTIONS } from "@/lib/collections";
import { friendlyFirebaseError } from "@/lib/errors";
import type { StudyDocument, TutorConversationRecord, TutorMessageRecord } from "@/lib/types";

export function TutorScreen() {
  const { user, limits } = useAccount();
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [conversations, setConversations] = useState<TutorConversationRecord[]>([]);
  const [conversationId, setConversationId] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [messageState, setMessageState] = useState<{ id: string; messages: TutorMessageRecord[] }>({ id: "", messages: [] });
  const messages = messageState.id === conversationId ? messageState.messages : [];
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!user || !limits.aiTutor) return;
    listOwned<StudyDocument>(COLLECTIONS.documents, user.uid).then(setDocuments).catch((err) => setError(friendlyFirebaseError(err)));
    listOwned<TutorConversationRecord>(COLLECTIONS.conversations, user.uid).then(setConversations).catch((err) => setError(friendlyFirebaseError(err)));
  }, [user, limits.aiTutor]);

  useEffect(() => {
    if (!user || !conversationId) return;
    listWhere<TutorMessageRecord>(COLLECTIONS.messages, user.uid, "conversationId", conversationId, "createdAtMs")
      .then((next) => setMessageState({ id: conversationId, messages: next }))
      .catch((err) => setError(friendlyFirebaseError(err)));
  }, [user, conversationId]);

  async function send() {
    if (!user?.emailVerified) return setError("Verify your email before asking the tutor.");
    if (!documentId) return setError("Choose the document this question is about.");
    if (!draft.trim()) return;
    setWorking(true);
    setError(null);
    try {
      const result = await authFetch<{ conversationId: string; reply: string; beyondSource: boolean }>("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: conversationId || undefined, documentId, message: draft.trim() }),
      });
      setConversationId(result.conversationId);
      setDraft("");
      const [nextConversations, nextMessages] = await Promise.all([
        listOwned<TutorConversationRecord>(COLLECTIONS.conversations, user.uid),
        listWhere<TutorMessageRecord>(COLLECTIONS.messages, user.uid, "conversationId", result.conversationId, "createdAtMs"),
      ]);
      setConversations(nextConversations);
      setMessageState({ id: result.conversationId, messages: nextMessages });
    } catch (err) {
      setError(err instanceof Error ? err.message : "The tutor could not reply.");
    } finally {
      setWorking(false);
    }
  }

  if (!limits.aiTutor) {
    return (
      <>
        <PageHeader title="AI Tutor" lede="Ask questions about one uploaded document. Replies that leave the source are marked." />
        <Card>
          <h2 className="font-display text-2xl">Included with Student</h2>
          <p className="mt-3 text-sm leading-6 text-muted">The tutor is built and checked on the server. Payments are not open yet, so it stays locked on the Free plan. It will not answer until a verified Student or Pro subscription is active.</p>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="AI Tutor" lede="The tutor uses one document at a time and flags replies that go beyond it." />
      {error ? <div className="mb-4"><Alert>{error}</Alert></div> : null}
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-2">
          <Button variant="secondary" className="w-full" onClick={() => setConversationId("")}>New conversation</Button>
          {conversations.map((item) => (
            <button key={item.id} type="button" onClick={() => { setConversationId(item.id); setDocumentId(item.documentId); }} className={`block w-full rounded-2xl border px-3 py-2 text-left text-sm ${conversationId === item.id ? "border-pine" : "border-line bg-card"}`}>
              {item.title}
            </button>
          ))}
        </aside>
        <div>
          <Field label="Document">
            <select className={fieldClass} value={documentId} onChange={(event) => setDocumentId(event.target.value)} disabled={Boolean(conversationId)}>
              <option value="">Choose a document</option>
              {documents.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </Field>
          <div className="mt-4 space-y-3">
            {messages.map((message) => (
              <div key={message.id} className={`rounded-3xl border px-4 py-3 text-sm leading-6 ${message.role === "user" ? "border-line bg-card" : "border-pine/20 bg-[#f4f8f6]"}`}>
                <p className="text-xs uppercase tracking-wide text-muted">{message.role === "user" ? "You" : "Tutor"}{message.beyondSource ? " · Goes beyond your notes" : ""}</p>
                <p className="mt-1 whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-3">
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={4} maxLength={2000} className={fieldClass} placeholder="Ask about this document." />
            <Button disabled={working} onClick={send}>{working ? "Thinking…" : "Send"}</Button>
          </div>
        </div>
      </div>
    </>
  );
}
