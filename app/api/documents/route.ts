import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { requireUser, requireVerified } from "@/lib/auth-server";
import { adminBucket, adminDb } from "@/lib/firebase/admin";
import { ApiError, json, jsonError } from "@/lib/http";
import { COLLECTIONS } from "@/lib/collections";
import { assertReadableText, detectUpload, extractUpload } from "@/lib/extract";
import { formatBytes, PLANS } from "@/lib/plans";
import { capStoredText, safeFileName } from "@/lib/text";
import { getUserPlan, recordSession, reserveUsage } from "@/lib/usage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const pasteSchema = z.object({
  title: z.string().trim().max(160).optional(),
  text: z.string().trim().min(40, "Paste at least a short paragraph.").max(500_000),
});

function titleFrom(text: string, fallback: string) {
  const line = text.split("\n").map((item) => item.trim()).find((item) => item.length > 0) || fallback;
  return line.slice(0, 120);
}

export async function POST(request: Request) {
  let refund: (() => Promise<void>) | null = null;
  let saved = false;
  try {
    const user = await requireUser(request);
    requireVerified(user);
    const plan = await getUserPlan(user.uid, user.email);
    const limits = PLANS[plan];
    const contentType = request.headers.get("content-type") || "";

    let title = "";
    let sourceType: "pdf" | "docx" | "txt" | "paste" = "paste";
    let fileName: string | null = null;
    let bytes: Uint8Array | null = null;
    let text = "";

    if (contentType.includes("application/json")) {
      const body = pasteSchema.parse(await request.json());
      text = body.text;
      title = body.title?.trim() || titleFrom(text, "Pasted notes");
      sourceType = "paste";
    } else {
      const form = await request.formData();
      const file = form.get("file");
      const requestedTitle = String(form.get("title") || "").trim();
      if (!(file instanceof File)) throw new ApiError(400, "Choose a PDF, DOCX, or TXT file.");
      if (file.size <= 0) throw new ApiError(400, "That file is empty.");
      if (file.size > limits.maxUploadBytes) {
        throw new ApiError(400, `The ${limits.label} plan accepts files up to ${formatBytes(limits.maxUploadBytes)}. This file is larger.`);
      }
      bytes = new Uint8Array(await file.arrayBuffer());
      const kind = detectUpload(file.name || "upload", bytes);
      text = await extractUpload(kind, bytes);
      sourceType = kind;
      fileName = safeFileName(file.name || `notes.${kind}`);
      title = requestedTitle || titleFrom(fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "), "Uploaded notes");
    }

    assertReadableText(text);
    const stored = capStoredText(text);
    refund = await reserveUsage(user.uid, "uploads", plan);

    const ref = adminDb().collection(COLLECTIONS.documents).doc();
    let storagePath: string | null = null;
    if (bytes && fileName) {
      const bucket = adminBucket();
      if (!bucket) {
        throw new ApiError(503, "Firebase Storage is not configured. Set the storage bucket, or paste the text instead.");
      }
      storagePath = `users/${user.uid}/documents/${ref.id}/${fileName}`;
      await bucket.file(storagePath).save(Buffer.from(bytes), {
        resumable: false,
        contentType: sourceType === "pdf" ? "application/pdf" : sourceType === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "text/plain",
        metadata: { metadata: { uid: user.uid } },
      });
    }

    await ref.set({
      uid: user.uid,
      title,
      sourceType,
      fileName,
      storagePath,
      text: stored.text,
      charCount: stored.text.length,
      extractedCharCount: stored.extractedCharCount,
      textTruncated: stored.textTruncated,
      createdAt: FieldValue.serverTimestamp(),
      createdAtMs: Date.now(),
    });
    saved = true;
    await recordSession(user.uid, "upload", ref.id);
    return json({ id: ref.id, title, charCount: stored.text.length, textTruncated: stored.textTruncated });
  } catch (error) {
    if (refund && !saved) await refund().catch(() => undefined);
    return jsonError(error);
  }
}
