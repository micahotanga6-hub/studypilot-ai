import { requireUser } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase/admin";
import { json, jsonError } from "@/lib/http";
import { COLLECTIONS } from "@/lib/collections";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    const snap = await adminDb().collection(COLLECTIONS.quizzes).doc(id).get();
    if (!snap.exists || snap.get("uid") !== user.uid) {
      return json({ error: "That quiz was not found." }, 404);
    }
    const data = snap.data() || {};
    return json({
      id: snap.id,
      title: data.title,
      format: data.format,
      difficulty: data.difficulty,
      topic: data.topic || "",
      documentTitle: data.documentTitle || "",
      sourceCharsUsed: data.sourceCharsUsed || 0,
      sourceCharsTotal: data.sourceCharsTotal || 0,
      questions: data.questions || [],
    });
  } catch (error) {
    return jsonError(error);
  }
}
