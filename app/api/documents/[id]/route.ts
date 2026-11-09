import { requireUser } from "@/lib/auth-server";
import { adminBucket, adminDb } from "@/lib/firebase/admin";
import { json, jsonError } from "@/lib/http";
import { COLLECTIONS } from "@/lib/collections";
import { deleteQuery } from "@/lib/usage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    const ref = adminDb().collection(COLLECTIONS.documents).doc(id);
    const snap = await ref.get();
    if (!snap.exists || snap.get("uid") !== user.uid) {
      return json({ error: "That document was not found." }, 404);
    }
    const storagePath = snap.get("storagePath");
    const deckIds = await deleteQuery(COLLECTIONS.decks, "documentId", id, user.uid);
    for (const deckId of deckIds) {
      await deleteQuery(COLLECTIONS.cards, "deckId", deckId, user.uid);
    }
    const quizIds = await deleteQuery(COLLECTIONS.quizzes, "documentId", id, user.uid);
    for (const quizId of quizIds) {
      await adminDb().collection(COLLECTIONS.quizAnswers).doc(quizId).delete().catch(() => undefined);
      await deleteQuery(COLLECTIONS.attempts, "quizId", quizId, user.uid);
    }
    await deleteQuery(COLLECTIONS.summaries, "documentId", id, user.uid);
    if (typeof storagePath === "string" && storagePath) {
      const bucket = adminBucket();
      if (bucket) await bucket.file(storagePath).delete({ ignoreNotFound: true }).catch(() => undefined);
    }
    await ref.delete();
    return json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
