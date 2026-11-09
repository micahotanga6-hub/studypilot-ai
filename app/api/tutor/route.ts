import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { requireUser, requireVerified } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase/admin";
import { ApiError, json, jsonError } from "@/lib/http";
import { COLLECTIONS } from "@/lib/collections";
import { generateValidated } from "@/lib/grok";
import { tutorSchema, tutorJsonSchema } from "@/lib/schemas";
import { sourceBlock, tutorSystem } from "@/lib/prompts";
import { PLANS } from "@/lib/plans";
import { excerptForPlan, ownedDocument } from "@/lib/owned";
import { getUserPlan, recordSession, reserveUsage } from "@/lib/usage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  conversationId: z.string().min(1).max(128).optional(),
  documentId: z.string().min(1).max(128),
  message: z.string().trim().min(1, "Write a question.").max(2000),
});

export async function POST(request: Request) {
  let refund: (() => Promise<void>) | null = null;
  try {
    const user = await requireUser(request);
    requireVerified(user);
    const body = bodySchema.parse(await request.json());
    const plan = await getUserPlan(user.uid, user.email);
    if (!PLANS[plan].aiTutor) {
      throw new ApiError(403, "The AI tutor is part of the Student plan. Payments are not open yet, so it stays locked.", "PLAN");
    }
    const document = await ownedDocument(user.uid, body.documentId);
    const db = adminDb();
    let conversationId = body.conversationId;
    if (conversationId) {
      const existing = await db.collection(COLLECTIONS.conversations).doc(conversationId).get();
      if (!existing.exists || existing.get("uid") !== user.uid) {
        throw new ApiError(404, "That conversation was not found.");
      }
      if (existing.get("documentId") !== document.id) {
        throw new ApiError(400, "This conversation is tied to a different document.");
      }
    }
    const source = excerptForPlan(document.text, PLANS[plan]);
    const historySnap = conversationId
      ? await db.collection(COLLECTIONS.messages).where("uid", "==", user.uid).where("conversationId", "==", conversationId).limit(12).get()
      : null;
    const history = (historySnap?.docs || [])
      .map((item) => item.data())
      .sort((a, b) => Number(a.createdAtMs || 0) - Number(b.createdAtMs || 0))
      .slice(-8)
      .map((item) => `${item.role === "assistant" ? "Tutor" : "Student"}: ${String(item.content || "").slice(0, 800)}`)
      .join("\n");
    refund = await reserveUsage(user.uid, "tutorMessages", plan);
    const generated = await generateValidated(
      {
        system: tutorSystem(source.truncated),
        user: [
          sourceBlock(source.excerpt, "SOURCE MATERIAL"),
          history ? `CONVERSATION SO FAR\n${history}` : "",
          `STUDENT\n${body.message}`,
        ]
          .filter(Boolean)
          .join("\n\n"),
        schemaName: "tutor_reply",
        jsonSchema: tutorJsonSchema,
        maxTokens: 1400,
      },
      (data) => tutorSchema.parse(data),
    );
    const now = Date.now();
    if (!conversationId) {
      const created = db.collection(COLLECTIONS.conversations).doc();
      conversationId = created.id;
      await created.set({
        uid: user.uid,
        documentId: document.id,
        documentTitle: document.title,
        title: body.message.slice(0, 80),
        createdAt: FieldValue.serverTimestamp(),
        createdAtMs: now,
      });
    }
    const batch = db.batch();
    const userRef = db.collection(COLLECTIONS.messages).doc();
    const assistantRef = db.collection(COLLECTIONS.messages).doc();
    batch.set(userRef, {
      uid: user.uid,
      conversationId,
      role: "user",
      content: body.message,
      beyondSource: false,
      createdAt: FieldValue.serverTimestamp(),
      createdAtMs: now,
    });
    batch.set(assistantRef, {
      uid: user.uid,
      conversationId,
      role: "assistant",
      content: generated.reply,
      beyondSource: generated.beyondSource,
      createdAt: FieldValue.serverTimestamp(),
      createdAtMs: now + 1,
    });
    await batch.commit();
    await recordSession(user.uid, "tutor", conversationId);
    return json({
      conversationId,
      reply: generated.reply,
      beyondSource: generated.beyondSource,
      truncated: source.truncated,
    });
  } catch (error) {
    if (refund) await refund().catch(() => undefined);
    return jsonError(error);
  }
}
