import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { requireUser, requireVerified } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase/admin";
import { json, jsonError } from "@/lib/http";
import { COLLECTIONS } from "@/lib/collections";
import { displayAnswer, isCorrect, type AnswerKeyItem } from "@/lib/quiz";
import { recordSession } from "@/lib/usage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  answers: z.array(z.object({ questionId: z.string().min(1).max(20), value: z.string().max(1000) })).max(40),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    requireVerified(user);
    const { id } = await context.params;
    const body = bodySchema.parse(await request.json());
    const quizSnap = await adminDb().collection(COLLECTIONS.quizzes).doc(id).get();
    if (!quizSnap.exists || quizSnap.get("uid") !== user.uid) {
      return json({ error: "That quiz was not found." }, 404);
    }
    const keySnap = await adminDb().collection(COLLECTIONS.quizAnswers).doc(id).get();
    const items = (keySnap.get("items") || []) as AnswerKeyItem[];
    if (!keySnap.exists || keySnap.get("uid") !== user.uid || items.length === 0) {
      return json({ error: "The answer key for this quiz is missing, so it cannot be marked." }, 409);
    }
    const given = new Map(body.answers.map((answer) => [answer.questionId, answer.value]));
    const review = items.map((question) => {
      const value = given.get(question.questionId) || "";
      const correct = isCorrect(question, value);
      return {
        questionId: question.questionId,
        prompt: question.prompt,
        type: question.type,
        yourAnswer: value,
        correctAnswer: displayAnswer(question),
        correct,
        explanation: question.explanation,
        topic: question.topic,
      };
    });
    const score = review.filter((item) => item.correct).length;
    const total = review.length;
    const topicsToReview = [...new Set(review.filter((item) => !item.correct).map((item) => item.topic))];
    const now = Date.now();
    const attempt = await adminDb().collection(COLLECTIONS.attempts).add({
      uid: user.uid,
      quizId: id,
      quizTitle: String(quizSnap.get("title") || "Quiz"),
      score,
      total,
      percent: total === 0 ? 0 : Math.round((score / total) * 100),
      topicsToReview,
      review: review.filter((item) => !item.correct).map((item) => ({
        prompt: item.prompt,
        yourAnswer: item.yourAnswer,
        correctAnswer: item.correctAnswer,
        explanation: item.explanation,
        topic: item.topic,
      })),
      createdAt: FieldValue.serverTimestamp(),
      createdAtMs: now,
    });
    await recordSession(user.uid, "quiz", id);
    return json({
      attemptId: attempt.id,
      score,
      total,
      percent: total === 0 ? 0 : Math.round((score / total) * 100),
      topicsToReview,
      review,
    });
  } catch (error) {
    return jsonError(error);
  }
}
