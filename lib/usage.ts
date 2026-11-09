import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { ApiError } from "@/lib/http";
import { COLLECTIONS } from "@/lib/collections";
import { isPlanId, limitMessage, monthKey, PLANS } from "@/lib/plans";
import type { PlanId, UsageCounts } from "@/lib/types";

const AI_KINDS = new Set<keyof UsageCounts>(["notes", "decks", "quizzes", "tutorMessages", "plannerGenerations"]);

export async function getUserPlan(uid: string, email: string): Promise<PlanId> {
  const ref = adminDb().collection(COLLECTIONS.users).doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({
      email,
      displayName: "",
      plan: "free",
      createdAt: FieldValue.serverTimestamp(),
      createdAtMs: Date.now(),
    });
    return "free";
  }
  const plan = snap.get("plan");
  return isPlanId(plan) ? plan : "free";
}

export async function reserveUsage(uid: string, kind: keyof UsageCounts, plan: PlanId): Promise<() => Promise<void>> {
  const limits = PLANS[plan];
  const limit = limits[kind];
  if (limit <= 0) {
    throw new ApiError(403, `${limits.label} does not include this. It stays locked until a verified Student or Pro subscription is active.`, "PLAN");
  }
  const db = adminDb();
  const month = monthKey();
  const ref = db.collection(COLLECTIONS.usage).doc(`${uid}_${month}`);
  const hour = new Date().toISOString().slice(0, 13);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() || {};
    const count = Number(data[kind] || 0);
    if (count >= limit) throw new ApiError(403, limitMessage(kind, limit, limits.label), "LIMIT");
    const hourCount = data.hourKey === hour ? Number(data.hourCount || 0) : 0;
    if (AI_KINDS.has(kind) && hourCount >= limits.hourlyAi) {
      throw new ApiError(429, "You have reached this hour's study limit. Wait a while and try again.", "RATE");
    }
    tx.set(
      ref,
      {
        uid,
        month,
        [kind]: count + 1,
        hourKey: hour,
        hourCount: AI_KINDS.has(kind) ? hourCount + 1 : hourCount,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });
  return async function refund() {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.data() || {};
      const patch: Record<string, number> = { [kind]: Math.max(0, Number(data[kind] || 0) - 1) };
      if (AI_KINDS.has(kind) && data.hourKey === hour) {
        patch.hourCount = Math.max(0, Number(data.hourCount || 0) - 1);
      }
      tx.set(ref, patch, { merge: true });
    });
  };
}

export async function recordSession(uid: string, kind: string, refId: string) {
  try {
    await adminDb().collection(COLLECTIONS.sessions).add({
      uid,
      kind,
      refId,
      createdAt: FieldValue.serverTimestamp(),
      createdAtMs: Date.now(),
    });
  } catch (error) {
    console.error("Could not record a study session.", error instanceof Error ? error.message : error);
  }
}

export async function deleteQuery(collectionName: string, field: string, value: string, uid: string) {
  const snap = await adminDb().collection(collectionName).where(field, "==", value).get();
  const docs = snap.docs.filter((item) => item.get("uid") === uid);
  for (let index = 0; index < docs.length; index += 400) {
    const batch = adminDb().batch();
    for (const item of docs.slice(index, index + 400)) batch.delete(item.ref);
    await batch.commit();
  }
  return docs.map((item) => item.id);
}
