import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { requireUser, requireVerified } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase/admin";
import { ApiError, json, jsonError } from "@/lib/http";
import { COLLECTIONS } from "@/lib/collections";
import { generateValidated } from "@/lib/grok";
import { quizJsonSchema } from "@/lib/schemas";
import { quizSystem, sourceBlock } from "@/lib/prompts";
import { PLANS } from "@/lib/plans";
import { normalizeQuiz } from "@/lib/quiz";
import { excerptForPlan, ownedDocument } from "@/lib/owned";
import { getUserPlan, recordSession, reserveUsage } from "@/lib/usage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  documentId: z.string().min(1).max(128),
  format: z.enum(["mcq", "true_false", "short_answer", "mixed", "exam"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  count: z.number().int().min(1).max(40),
  topic: z.string().trim().max(80).optional(),
});

export async function POST(request: Request) {
  let refund: (() => Promise<void>) | null = null;
  try {
    const user = await requireUser(request);
    requireVerified(user);
    const body = bodySchema.parse(await request.json());
    const plan = await getUserPlan(user.uid, user.email);
    const limits = PLANS[plan];
    if (!limits.quizFormats.includes(body.format)) {
      throw new ApiError(403, "Exam-style practice is part of the Pro plan. Payments are not open yet, so it stays locked.", "PLAN");
    }
    if (!limits.difficulties.includes(body.difficulty)) {
      throw new ApiError(403, "Hard quizzes are part of the Student plan. Payments are not open yet, so that difficulty stays locked.", "PLAN");
    }
    if (body.count > limits.questionsPerQuiz) {
      throw new ApiError(403, `The ${limits.label} plan allows up to ${limits.questionsPerQuiz} questions in a quiz.`, "PLAN");
    }
    const document = await ownedDocument(user.uid, body.documentId);
    const source = excerptForPlan(document.text, limits);
    refund = await reserveUsage(user.uid, "quizzes", plan);
    const focus = body.topic ? `\nFocus on this topic only where the source discusses it: ${body.topic}. If the source does not discuss it, say so in the title and write questions from what is actually there.` : "";
    const generated = await generateValidated(
      {
        system: quizSystem(body.format, body.difficulty, body.count, source.truncated, limits.advancedExplanations),
        user: `${sourceBlock(source.excerpt, "SOURCE MATERIAL")}${focus}`,
        schemaName: "practice_quiz",
        jsonSchema: quizJsonSchema,
        maxTokens: 4000,
      },
      (data) => normalizeQuiz(data, body.format, body.count),
    );
    const now = Date.now();
    const quizRef = adminDb().collection(COLLECTIONS.quizzes).doc();
    const batch = adminDb().batch();
    batch.set(quizRef, {
      uid: user.uid,
      documentId: document.id,
      documentTitle: document.title,
      title: generated.title,
      format: body.format,
      difficulty: body.difficulty,
      topic: body.topic || "",
      questionCount: generated.questions.length,
      questions: generated.questions.map((question) => ({
        id: question.questionId,
        type: question.type,
        prompt: question.prompt,
        options: question.options,
      })),
      sourceCharsUsed: source.used,
      sourceCharsTotal: source.total,
      createdAt: FieldValue.serverTimestamp(),
      createdAtMs: now,
    });
    batch.set(adminDb().collection(COLLECTIONS.quizAnswers).doc(quizRef.id), {
      uid: user.uid,
      quizId: quizRef.id,
      items: generated.questions.map((question) => ({
        questionId: question.questionId,
        type: question.type,
        prompt: question.prompt,
        options: question.options,
        answer: question.answer,
        acceptable: question.acceptable,
        explanation: question.explanation,
        topic: question.topic,
      })),
    });
    await batch.commit();
    await recordSession(user.uid, "quiz", quizRef.id);
    return json({
      id: quizRef.id,
      questionCount: generated.questions.length,
      truncated: source.truncated,
      used: source.used,
      total: source.total,
    });
  } catch (error) {
    if (refund) await refund().catch(() => undefined);
    return jsonError(error);
  }
}
