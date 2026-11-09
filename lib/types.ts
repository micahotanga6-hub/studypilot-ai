export type PlanId = "free" | "student" | "pro";

export type SourceType = "pdf" | "docx" | "txt" | "paste";

export type NoteStyle =
  | "short"
  | "simple"
  | "key_points"
  | "definitions"
  | "detailed"
  | "chapter"
  | "revision";

export type QuizFormat = "mcq" | "true_false" | "short_answer" | "mixed" | "exam";

export type QuizDifficulty = "easy" | "medium" | "hard";

export type CardDifficulty = "easy" | "medium" | "difficult";

export type QuestionType = "mcq" | "true_false" | "short_answer";

export interface UsageCounts {
  uploads: number;
  notes: number;
  decks: number;
  quizzes: number;
  tutorMessages: number;
  plannerGenerations: number;
}

export interface StudyDocument {
  id: string;
  uid: string;
  title: string;
  sourceType: SourceType;
  fileName: string | null;
  storagePath: string | null;
  text: string;
  charCount: number;
  extractedCharCount: number;
  textTruncated: boolean;
  createdAtMs: number;
}

export interface SummaryRecord {
  id: string;
  uid: string;
  documentId: string;
  documentTitle: string;
  title: string;
  style: NoteStyle;
  markdown: string;
  sourceCharsUsed: number;
  sourceCharsTotal: number;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface DeckRecord {
  id: string;
  uid: string;
  documentId: string;
  documentTitle: string;
  title: string;
  cardCount: number;
  sourceCharsUsed: number;
  sourceCharsTotal: number;
  createdAtMs: number;
}

export interface FlashcardRecord {
  id: string;
  uid: string;
  deckId: string;
  front: string;
  back: string;
  order: number;
  difficulty: CardDifficulty | null;
  learned: boolean;
  nextReviewAtMs: number | null;
}

export interface QuizQuestionPublic {
  id: string;
  type: QuestionType;
  prompt: string;
  options: string[];
}

export interface QuizRecord {
  id: string;
  uid: string;
  documentId: string;
  documentTitle: string;
  title: string;
  format: QuizFormat;
  difficulty: QuizDifficulty;
  topic: string;
  questionCount: number;
  questions: QuizQuestionPublic[];
  sourceCharsUsed: number;
  sourceCharsTotal: number;
  createdAtMs: number;
}

export interface QuizAttemptRecord {
  id: string;
  uid: string;
  quizId: string;
  quizTitle: string;
  score: number;
  total: number;
  percent: number;
  topicsToReview: string[];
  createdAtMs: number;
}

export interface StudyPlanRecord {
  id: string;
  uid: string;
  title: string;
  subjects: string[];
  source: "manual" | "ai";
  createdAtMs: number;
}

export interface StudyTaskRecord {
  id: string;
  uid: string;
  planId: string;
  title: string;
  subject: string;
  date: string;
  kind: "study" | "revision";
  done: boolean;
  createdAtMs: number;
}

export interface TutorConversationRecord {
  id: string;
  uid: string;
  documentId: string;
  documentTitle: string;
  title: string;
  createdAtMs: number;
}

export interface TutorMessageRecord {
  id: string;
  uid: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  beyondSource: boolean;
  createdAtMs: number;
}

export interface StudySessionRecord {
  id: string;
  uid: string;
  kind: string;
  refId: string;
  createdAtMs: number;
}

export interface PaymentRecord {
  id: string;
  uid: string;
  provider: string;
  externalId: string;
  amountCents: number;
  currency: string;
  status: string;
  createdAtMs: number;
}

export interface ProfileRecord {
  displayName: string;
  school: string;
  ageConfirmed: boolean;
}
