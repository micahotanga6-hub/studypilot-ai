import type {
  NoteStyle,
  PlanId,
  QuizDifficulty,
  QuizFormat,
  UsageCounts,
} from "./types";

export interface PlanLimits {
  id: PlanId;
  label: string;
  price: string;
  blurb: string;
  uploads: number;
  notes: number;
  decks: number;
  cardsPerDeck: number;
  quizzes: number;
  questionsPerQuiz: number;
  tutorMessages: number;
  plannerGenerations: number;
  hourlyAi: number;
  maxUploadBytes: number;
  maxSourceChars: number;
  noteStyles: NoteStyle[];
  quizFormats: QuizFormat[];
  difficulties: QuizDifficulty[];
  aiTutor: boolean;
  aiPlanner: boolean;
  advancedExplanations: boolean;
}

const basicStyles: NoteStyle[] = ["short", "simple", "key_points", "definitions"];
const allStyles: NoteStyle[] = [...basicStyles, "detailed", "chapter", "revision"];
const basicFormats: QuizFormat[] = ["mcq", "true_false", "short_answer", "mixed"];

export const PLANS: Record<PlanId, PlanLimits> = {
  free: {
    id: "free",
    label: "Free",
    price: "$0",
    blurb: "Try the study tools on your own material, with a monthly cap.",
    uploads: 3,
    notes: 5,
    decks: 2,
    cardsPerDeck: 10,
    quizzes: 3,
    questionsPerQuiz: 8,
    tutorMessages: 0,
    plannerGenerations: 0,
    hourlyAi: 12,
    maxUploadBytes: 2 * 1024 * 1024,
    maxSourceChars: 16_000,
    noteStyles: basicStyles,
    quizFormats: basicFormats,
    difficulties: ["easy", "medium"],
    aiTutor: false,
    aiPlanner: false,
    advancedExplanations: false,
  },
  student: {
    id: "student",
    label: "Student",
    price: "$4.99",
    blurb: "Higher monthly limits, fuller notes, the tutor, and AI study plans.",
    uploads: 30,
    notes: 40,
    decks: 20,
    cardsPerDeck: 24,
    quizzes: 30,
    questionsPerQuiz: 20,
    tutorMessages: 200,
    plannerGenerations: 8,
    hourlyAi: 40,
    maxUploadBytes: 4 * 1024 * 1024,
    maxSourceChars: 48_000,
    noteStyles: allStyles,
    quizFormats: basicFormats,
    difficulties: ["easy", "medium", "hard"],
    aiTutor: true,
    aiPlanner: true,
    advancedExplanations: false,
  },
  pro: {
    id: "pro",
    label: "Pro",
    price: "$8.99",
    blurb: "The highest limits, exam-style practice, and longer explanations.",
    uploads: 100,
    notes: 120,
    decks: 60,
    cardsPerDeck: 40,
    quizzes: 100,
    questionsPerQuiz: 30,
    tutorMessages: 800,
    plannerGenerations: 30,
    hourlyAi: 80,
    maxUploadBytes: 4 * 1024 * 1024,
    maxSourceChars: 80_000,
    noteStyles: allStyles,
    quizFormats: [...basicFormats, "exam"],
    difficulties: ["easy", "medium", "hard"],
    aiTutor: true,
    aiPlanner: true,
    advancedExplanations: true,
  },
};

export const PLAN_LIST: PlanLimits[] = [PLANS.free, PLANS.student, PLANS.pro];

export const NOTE_STYLES: { id: NoteStyle; label: string; description: string }[] = [
  { id: "short", label: "Short summary", description: "A brief overview of the main ideas." },
  { id: "simple", label: "Simple explanation", description: "Plain language for someone new to the topic." },
  { id: "key_points", label: "Key points", description: "The important points as a tight list." },
  { id: "definitions", label: "Definitions and vocabulary", description: "Terms the source explains, in its own words." },
  { id: "detailed", label: "Detailed summary", description: "A fuller summary that keeps important details." },
  { id: "chapter", label: "Chapter by chapter", description: "Separate sections that follow the source." },
  { id: "revision", label: "Revision notes", description: "Condensed notes for review before a test." },
];

export const QUIZ_FORMATS: { id: QuizFormat; label: string; description: string }[] = [
  { id: "mcq", label: "Multiple choice", description: "One correct option out of four." },
  { id: "true_false", label: "True or false", description: "Statements to judge from the source." },
  { id: "short_answer", label: "Short answer", description: "A few words or a sentence." },
  { id: "mixed", label: "Mixed", description: "A mix of the three question types." },
  { id: "exam", label: "Exam-style practice", description: "A harder mixed set. Not an official exam paper." },
];

export const QUIZ_DIFFICULTIES: { id: QuizDifficulty; label: string }[] = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
];

export function isPlanId(value: unknown): value is PlanId {
  return value === "free" || value === "student" || value === "pro";
}

export function emptyUsage(): UsageCounts {
  return { uploads: 0, notes: 0, decks: 0, quizzes: 0, tutorMessages: 0, plannerGenerations: 0 };
}

export function monthKey(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function usageFieldLabel(kind: keyof UsageCounts): string {
  switch (kind) {
    case "uploads":
      return "uploads";
    case "notes":
      return "note generations";
    case "decks":
      return "flashcard decks";
    case "quizzes":
      return "quizzes";
    case "tutorMessages":
      return "tutor messages";
    case "plannerGenerations":
      return "AI study plans";
  }
}

export function limitMessage(kind: keyof UsageCounts, limit: number, planLabel: string): string {
  return `The ${planLabel} plan includes ${limit} ${usageFieldLabel(kind)} each month. This month's allowance is used.`;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}
