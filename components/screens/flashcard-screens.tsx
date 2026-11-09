"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, Empty, Field, PageHeader, fieldClass } from "@/components/ui";
import { useAccount } from "@/components/use-account";
import { useAuth } from "@/components/auth-provider";
import { authFetch } from "@/lib/api-client";
import { createOwned, getOwned, listOwned, listWhere, removeOwned, saveFields } from "@/lib/client-data";
import { COLLECTIONS } from "@/lib/collections";
import { friendlyFirebaseError } from "@/lib/errors";
import { formatWhen } from "@/lib/format";
import { shuffle } from "@/lib/text";
import type { CardDifficulty, DeckRecord, FlashcardRecord, StudyDocument } from "@/lib/types";

export function DecksScreen() {
  const { user } = useAuth();
  const [decks, setDecks] = useState<DeckRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    listOwned<DeckRecord>(COLLECTIONS.decks, user.uid).then(setDecks).catch((err) => setError(friendlyFirebaseError(err)));
  }, [user]);
  return (
    <>
      <PageHeader title="Flashcards" lede="Decks generated from your documents. Open one to flip, shuffle, and mark what you have learned." action={<Link href="/app/flashcards/new" className="rounded-full bg-pine px-4 py-2.5 text-sm font-medium text-white">New deck</Link>} />
      {error ? <Alert>{error}</Alert> : null}
      {decks.length === 0 ? <Empty title="No decks yet" body="Generate a deck from a document." /> : (
        <ul className="divide-y divide-line rounded-3xl border border-line bg-card">
          {decks.map((deck) => (
            <li key={deck.id} className="px-5 py-4">
              <Link href={`/app/flashcards/${deck.id}`} className="font-medium underline decoration-line underline-offset-4">{deck.title}</Link>
              <p className="text-xs text-muted">{deck.cardCount} cards · {deck.documentTitle} · {formatWhen(deck.createdAtMs)}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function NewDeckScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, limits } = useAccount();
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [documentId, setDocumentId] = useState(params.get("document") || "");
  const [count, setCount] = useState(Math.min(8, limits.cardsPerDeck));
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!user) return;
    listOwned<StudyDocument>(COLLECTIONS.documents, user.uid).then(setDocuments).catch((err) => setError(friendlyFirebaseError(err)));
  }, [user]);

  async function generate() {
    if (!user?.emailVerified) return setError("Verify your email before generating cards.");
    if (!documentId) return setError("Choose a document.");
    setWorking(true);
    setError(null);
    try {
      const result = await authFetch<{ id: string }>("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, count }),
      });
      router.push(`/app/flashcards/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The deck could not be generated.");
      setWorking(false);
    }
  }

  return (
    <>
      <PageHeader title="New flashcard deck" lede={`The ${limits.label} plan allows up to ${limits.cardsPerDeck} cards in a deck.`} />
      {error ? <div className="mb-4"><Alert>{error}</Alert></div> : null}
      <div className="max-w-xl space-y-4">
        <Field label="Document">
          <select className={fieldClass} value={documentId} onChange={(event) => setDocumentId(event.target.value)}>
            <option value="">Choose a document</option>
            {documents.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </Field>
        <Field label="How many cards">
          <input type="number" min={4} max={limits.cardsPerDeck} value={count} onChange={(event) => setCount(Number(event.target.value))} className={fieldClass} />
        </Field>
        <Button disabled={working} onClick={generate}>{working ? "Making cards…" : "Generate deck"}</Button>
      </div>
    </>
  );
}

const DIFFICULTIES: CardDifficulty[] = ["easy", "medium", "difficult"];

function reviewDelay(difficulty: CardDifficulty) {
  if (difficulty === "easy") return Date.now() + 3 * 86_400_000;
  if (difficulty === "medium") return Date.now() + 86_400_000;
  return Date.now() + 4 * 60 * 60 * 1000;
}

export function DeckScreen({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [deck, setDeck] = useState<DeckRecord | null>(null);
  const [cards, setCards] = useState<FlashcardRecord[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [dueOnly, setDueOnly] = useState(false);
  const [dueAt, setDueAt] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getOwned<DeckRecord>(COLLECTIONS.decks, id, user.uid).then((item) => {
      if (!item) setError("That deck was not found.");
      else setDeck(item);
    }).catch((err) => setError(friendlyFirebaseError(err)));
    createOwned(COLLECTIONS.sessions, { uid: user.uid, kind: "review", refId: id }).catch(() => undefined);
    listWhere<FlashcardRecord>(COLLECTIONS.cards, user.uid, "deckId", id, "order").then((items) => {
      setCards(items);
      setOrder(items.map((item) => item.id));
    }).catch((err) => setError(friendlyFirebaseError(err)));
  }, [user, id]);

  const visibleIds = useMemo(() => {
    if (!dueOnly) return order;
    return order.filter((cardId) => {
      const card = cards.find((item) => item.id === cardId);
      return !card?.nextReviewAtMs || card.nextReviewAtMs <= dueAt;
    });
  }, [order, cards, dueOnly, dueAt]);
  const card = cards.find((item) => item.id === visibleIds[index]);
  const learned = cards.filter((item) => item.learned).length;

  async function updateCard(patch: Partial<FlashcardRecord>) {
    if (!card) return;
    const next = { ...card, ...patch };
    setCards((current) => current.map((item) => item.id === card.id ? next : item));
    await saveFields(COLLECTIONS.cards, card.id, {
      difficulty: next.difficulty,
      learned: next.learned,
      nextReviewAtMs: next.nextReviewAtMs,
    });
  }

  async function removeDeck() {
    if (!window.confirm("Delete this deck and its cards?")) return;
    await Promise.all(cards.map((item) => removeOwned(COLLECTIONS.cards, item.id)));
    await removeOwned(COLLECTIONS.decks, id);
    router.push("/app/flashcards");
  }

  function move(step: number) {
    if (visibleIds.length === 0) return;
    setIndex((current) => (current + step + visibleIds.length) % visibleIds.length);
    setFlipped(false);
  }

  if (error) return <Alert>{error}</Alert>;
  if (!deck) return <p className="text-sm text-muted">Loading deck…</p>;
  return (
    <>
      <PageHeader title={deck.title} lede={`${learned} of ${cards.length} marked learned. Easy cards wait about 3 days, medium about a day, and difficult cards come back in a few hours.`} />
      {deck.sourceCharsUsed < deck.sourceCharsTotal ? <div className="mb-4"><Alert tone="info">This deck was made from the first {deck.sourceCharsUsed.toLocaleString()} of {deck.sourceCharsTotal.toLocaleString()} characters.</Alert></div> : null}
      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => { setOrder(shuffle(order)); setIndex(0); setFlipped(false); }}>Shuffle</Button>
        <Button variant="secondary" onClick={() => { setDueAt(Date.now()); setDueOnly((value) => !value); setIndex(0); setFlipped(false); }}>{dueOnly ? "Show all cards" : "Due cards only"}</Button>
        <Button variant="ghost" onClick={() => move(-1)}>Previous</Button>
        <Button variant="danger" onClick={removeDeck}>Delete deck</Button>
        <Button variant="ghost" onClick={() => move(1)}>Next</Button>
      </div>
      {card ? (
        <>
          <p className="mb-3 text-sm text-muted">Card {Math.min(index + 1, visibleIds.length)} of {visibleIds.length}</p>
          <div className="flip-scene">
            <button type="button" className={`flip-card ${flipped ? "flipped" : ""}`} aria-pressed={flipped} onClick={() => setFlipped((value) => !value)}>
              <span className="flip-face">{card.front}</span>
              <span className="flip-face flip-back">{card.back}</span>
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {DIFFICULTIES.map((difficulty) => (
              <Button key={difficulty} variant={card.difficulty === difficulty ? "primary" : "secondary"} onClick={() => updateCard({ difficulty, nextReviewAtMs: reviewDelay(difficulty) })}>
                {difficulty[0].toUpperCase() + difficulty.slice(1)}
              </Button>
            ))}
            <Button variant={card.learned ? "primary" : "secondary"} onClick={() => updateCard({ learned: !card.learned })}>
              {card.learned ? "Learned" : "Not learned"}
            </Button>
          </div>
        </>
      ) : <Empty title="No cards in this view" body={dueOnly ? "Nothing is due. Show all cards to keep reviewing." : "This deck has no cards."} />}
    </>
  );
}
