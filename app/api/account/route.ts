import { z } from "zod";
import { getAdminAuth, adminBucket, adminDb } from "@/lib/firebase/admin";
import { requireUser } from "@/lib/auth-server";
import { ApiError, json, jsonError } from "@/lib/http";
import { COLLECTIONS } from "@/lib/collections";
import { deleteQuery } from "@/lib/usage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  confirm: z.literal("DELETE"),
});

const OWNED = [
  COLLECTIONS.documents,
  COLLECTIONS.summaries,
  COLLECTIONS.decks,
  COLLECTIONS.cards,
  COLLECTIONS.quizzes,
  COLLECTIONS.quizAnswers,
  COLLECTIONS.attempts,
  COLLECTIONS.plans,
  COLLECTIONS.tasks,
  COLLECTIONS.conversations,
  COLLECTIONS.messages,
  COLLECTIONS.sessions,
  COLLECTIONS.payments,
  COLLECTIONS.usage,
] as const;

export async function DELETE(request: Request) {
  try {
    const user = await requireUser(request);
    const body = bodySchema.parse(await request.json());
    if (body.confirm !== "DELETE") throw new ApiError(400, "Type DELETE to confirm.");
    for (const name of OWNED) {
      await deleteQuery(name, "uid", user.uid, user.uid);
    }
    const db = adminDb();
    await db.collection(COLLECTIONS.subscriptions).doc(user.uid).delete().catch(() => undefined);
    await db.collection(COLLECTIONS.users).doc(user.uid).delete().catch(() => undefined);
    await db.collection(COLLECTIONS.profiles).doc(user.uid).delete().catch(() => undefined);
    const bucket = adminBucket();
    if (bucket) await bucket.deleteFiles({ prefix: `users/${user.uid}/` }).catch(() => undefined);
    const auth = getAdminAuth();
    if (auth) await auth.deleteUser(user.uid);
    return json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
