import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { requireUser, requireVerified } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase/admin";
import { ApiError, json, jsonError } from "@/lib/http";
import { COLLECTIONS } from "@/lib/collections";
import { generateValidated } from "@/lib/grok";
import { plannerSchema, plannerJsonSchema } from "@/lib/schemas";
import { plannerSystem } from "@/lib/prompts";
import { PLANS } from "@/lib/plans";
import { getUserPlan, recordSession, reserveUsage } from "@/lib/usage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  subjects: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a real exam date."),
        hoursPerWeek: z.number().min(1).max(40),
        difficult: z.boolean(),
      }),
    )
    .min(1)
    .max(8),
  days: z.array(z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])).min(1),
  hoursPerDay: z.number().min(0.5).max(10),
});

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  let refund: (() => Promise<void>) | null = null;
  try {
    const user = await requireUser(request);
    requireVerified(user);
    const body = bodySchema.parse(await request.json());
    const plan = await getUserPlan(user.uid, user.email);
    if (!PLANS[plan].aiPlanner) {
      throw new ApiError(403, "AI study plans are part of the Student plan. Payments are not open yet, so generation stays locked. You can still add tasks yourself.", "PLAN");
    }
    const today = todayIso();
    for (const subject of body.subjects) {
      if (subject.examDate < today) {
        throw new ApiError(400, `${subject.name} has an exam date in the past. Pick a future date.`);
      }
    }
    refund = await reserveUsage(user.uid, "plannerGenerations", plan);
    const latestExam = body.subjects.map((subject) => subject.examDate).sort().at(-1) || today;
    const generated = await generateValidated(
      {
        system: plannerSystem(),
        user: `Today is ${today}. Available days: ${body.days.join(", ")}. Hours the student can study on an available day: ${body.hoursPerDay}.\nSubjects:\n${body.subjects
          .map((subject) => `- ${subject.name}; exam ${subject.examDate}; ${subject.hoursPerWeek} hours per week; difficult: ${subject.difficult ? "yes" : "no"}`)
          .join("\n")}`,
        schemaName: "study_plan",
        jsonSchema: plannerJsonSchema,
        maxTokens: 2500,
      },
      (data) => plannerSchema.parse(data),
    );
    const allowedDays = new Set(body.days);
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const tasks = generated.tasks.filter((task) => {
      if (task.date < today || task.date > latestExam) return false;
      const weekday = dayNames[new Date(`${task.date}T12:00:00Z`).getUTCDay()];
      return allowedDays.has(weekday as (typeof body.days)[number]);
    }).slice(0, 45);
    if (tasks.length === 0) {
      throw new ApiError(502, "The timetable did not include any usable dates. Try again with a wider set of days.");
    }
    const now = Date.now();
    const planRef = adminDb().collection(COLLECTIONS.plans).doc();
    const batch = adminDb().batch();
    batch.set(planRef, {
      uid: user.uid,
      title: generated.title,
      subjects: body.subjects.map((subject) => subject.name),
      source: "ai",
      createdAt: FieldValue.serverTimestamp(),
      createdAtMs: now,
    });
    tasks.forEach((task) => {
      const taskRef = adminDb().collection(COLLECTIONS.tasks).doc();
      batch.set(taskRef, {
        uid: user.uid,
        planId: planRef.id,
        title: task.title,
        subject: task.subject,
        date: task.date,
        kind: task.kind,
        done: false,
        createdAt: FieldValue.serverTimestamp(),
        createdAtMs: now,
      });
    });
    await batch.commit();
    await recordSession(user.uid, "planner", planRef.id);
    return json({ id: planRef.id, taskCount: tasks.length });
  } catch (error) {
    if (refund) await refund().catch(() => undefined);
    return jsonError(error);
  }
}
