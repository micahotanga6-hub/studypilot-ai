import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { requireUser, requireVerified } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase/admin";
import { ApiError, json, jsonError } from "@/lib/http";
import { COLLECTIONS } from "@/lib/collections";
import { generateValidated } from "@/lib/grok";
import { flashcardSchema, flashcardJsonSchema } from "@/lib/schemas";
import { flashcardSystem, sourceBlock } from "@/lib/prompts";
import { PLANS } from "@/lib/plans";
import { excerptForPlan, ownedDocument } from "@/lib/owned";
import { getUserPlan, recordSession, reserveUsage } from "@/lib/usage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  documentId: z.string().min(1).max(128),
  count: z.number().int().min(4).max(40),
});

export async function POST(request: Request) {
  let refund: (() => Promise<void>) | null = null;
  try {
    const user = await requireUser(request);
    requireVerified(user);
    const body = bodySchema.parse(await request.json());
    const plan = await getUserPlan(user.uid, user.email);
    const limits = PLANS[plan];
    if (body.count > limits.cardsPerDeck) {
      throw new ApiError(403, `The ${limits.label} plan allows up to ${limits.cardsPerDeck} cards in a deck.`, "PLAN");
    }
    const document = await ownedDocument(user.uid, body.documentId);
    const source = excerptForPlan(document.text, limits);
    refund = await reserveUsage(user.uid, "decks", plan);
    const generated = await generateValidated(
      {
        system: flashcardSystem(body.count, source.truncated),
        user: sourceBlock(source.excerpt, "SOURCE MATERIAL"),
        schemaName: "flashcards",
        jsonSchema: flashcardJsonSchema,
        maxTokens: 2500,
      },
      (data) => flashcardSchema.parse(data),
    );
    const cards = generated.cards.slice(0, body.count);
    const now = Date.now();
    const deckRef = adminDb().collection(COLLECTIONS.decks).doc();
    const batch = adminDb().batch();
    batch.set(deckRef, {
      uid: user.uid,
      documentId: document.id,
      documentTitle: document.title,
      title: generated.title,
      cardCount: cards.length,
      sourceCharsUsed: source.used,
      sourceCharsTotal: source.total,
      createdAt: FieldValue.serverTimestamp(),
      createdAtMs: now,
    });
    cards.forEach((card, index) => {
      const cardRef = adminDb().collection(COLLECTIONS.cards).doc();
      batch.set(cardRef, {
        uid: user.uid,
        deckId: deckRef.id,
        front: card.front,
        back: card.back,
        order: index,
        difficulty: null,
        learned: false,
        nextReviewAtMs: null,
        createdAtMs: now,
      });
    });
    await batch.commit();
    await recordSession(user.uid, "flashcards", deckRef.id);
    return json({ id: deckRef.id, cardCount: cards.length, truncated: source.truncated, used: source.used, total: source.total });
  } catch (error) {
    if (refund) await refund().catch(() => undefined);
    return jsonError(error);
  }
}
