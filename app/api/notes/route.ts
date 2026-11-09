import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { requireUser, requireVerified } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase/admin";
import { ApiError, json, jsonError } from "@/lib/http";
import { COLLECTIONS } from "@/lib/collections";
import { generateValidated } from "@/lib/grok";
import { noteSchema, noteJsonSchema } from "@/lib/schemas";
import { noteSystem, sourceBlock } from "@/lib/prompts";
import { PLANS } from "@/lib/plans";
import { excerptForPlan, ownedDocument } from "@/lib/owned";
import { getUserPlan, recordSession, reserveUsage } from "@/lib/usage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  documentId: z.string().min(1).max(128),
  style: z.enum(["short", "simple", "key_points", "definitions", "detailed", "chapter", "revision"]),
});

export async function POST(request: Request) {
  let refund: (() => Promise<void>) | null = null;
  try {
    const user = await requireUser(request);
    requireVerified(user);
    const body = bodySchema.parse(await request.json());
    const plan = await getUserPlan(user.uid, user.email);
    const limits = PLANS[plan];
    if (!limits.noteStyles.includes(body.style)) {
      throw new ApiError(403, "That note style is part of the Student plan. Payments are not open yet, so it stays locked.", "PLAN");
    }
    const document = await ownedDocument(user.uid, body.documentId);
    const source = excerptForPlan(document.text, limits);
    refund = await reserveUsage(user.uid, "notes", plan);
    const generated = await generateValidated(
      {
        system: noteSystem(body.style, source.truncated),
        user: sourceBlock(source.excerpt, "SOURCE MATERIAL"),
        schemaName: "study_notes",
        jsonSchema: noteJsonSchema,
        maxTokens: 3500,
      },
      (data) => noteSchema.parse(data),
    );
    const banner = source.truncated
      ? `> This note covers the first ${source.used.toLocaleString()} of ${source.total.toLocaleString()} characters. The rest was not sent to the model.\n\n`
      : "";
    const now = Date.now();
    const ref = adminDb().collection(COLLECTIONS.summaries).doc();
    await ref.set({
      uid: user.uid,
      documentId: document.id,
      documentTitle: document.title,
      title: generated.title,
      style: body.style,
      markdown: `${banner}${generated.markdown}`,
      sourceCharsUsed: source.used,
      sourceCharsTotal: source.total,
      createdAt: FieldValue.serverTimestamp(),
      createdAtMs: now,
      updatedAtMs: now,
    });
    await recordSession(user.uid, "notes", ref.id);
    return json({ id: ref.id });
  } catch (error) {
    if (refund) await refund().catch(() => undefined);
    return jsonError(error);
  }
}
