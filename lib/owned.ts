import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { ApiError } from "@/lib/http";
import { COLLECTIONS } from "@/lib/collections";
import { selectSource } from "@/lib/text";
import type { PlanLimits } from "@/lib/plans";

export interface OwnedDocument {
  id: string;
  title: string;
  text: string;
  charCount: number;
}

export async function ownedDocument(uid: string, id: string): Promise<OwnedDocument> {
  if (!id || id.length > 128) throw new ApiError(400, "Choose a document.");
  const snap = await adminDb().collection(COLLECTIONS.documents).doc(id).get();
  if (!snap.exists || snap.get("uid") !== uid) throw new ApiError(404, "That document was not found.");
  return {
    id: snap.id,
    title: String(snap.get("title") || "Untitled"),
    text: String(snap.get("text") || ""),
    charCount: Number(snap.get("charCount") || 0),
  };
}

export function excerptForPlan(text: string, limits: PlanLimits) {
  const source = selectSource(text, limits.maxSourceChars);
  if (source.excerpt.length < 40) {
    throw new ApiError(400, "This document does not have enough text to study.");
  }
  return source;
}
