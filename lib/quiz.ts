import type { QuestionType, QuizFormat } from "@/lib/types";
import { quizSchema } from "@/lib/schemas";
import { answersMatch, normalizeAnswer } from "@/lib/text";

export interface AnswerKeyItem {
  questionId: string;
  type: QuestionType;
  prompt: string;
  options: string[];
  answer: string;
  acceptable: string[];
  explanation: string;
  topic: string;
}

interface DraftQuestion {
  type: QuestionType;
  prompt: string;
  options: string[];
  answer: string;
  acceptable: string[];
  explanation: string;
  topic: string;
}

function asTrueFalse(answer: string): "true" | "false" | null {
  const value = normalizeAnswer(answer);
  if (value === "true" || value === "t" || value === "yes") return "true";
  if (value === "false" || value === "f" || value === "no") return "false";
  return null;
}

function matchOption(options: string[], answer: string): string | null {
  const exact = options.find((option) => normalizeAnswer(option) === normalizeAnswer(answer));
  if (exact) return exact;
  const letter = normalizeAnswer(answer).match(/\b([a-d])\b/)?.[1];
  if (letter) {
    const index = letter.charCodeAt(0) - 97;
    if (options[index]) return options[index];
  }
  const numeric = Number(normalizeAnswer(answer));
  if (Number.isInteger(numeric) && options[numeric - 1]) return options[numeric - 1];
  return null;
}

function buildQuestion(item: DraftQuestion, type: QuestionType, number: number): AnswerKeyItem | null {
  const prompt = item.prompt.trim();
  const explanation = item.explanation.trim();
  const topic = item.topic.trim() || "General";
  if (!prompt || !explanation) return null;
  if (type === "true_false") {
    const answer = asTrueFalse(item.answer);
    if (!answer) return null;
    return {
      questionId: `q${number}`,
      type,
      prompt,
      options: ["True", "False"],
      answer,
      acceptable: [],
      explanation,
      topic,
    };
  }
  if (type === "short_answer") {
    if (!item.answer.trim()) return null;
    return {
      questionId: `q${number}`,
      type,
      prompt,
      options: [],
      answer: item.answer.trim(),
      acceptable: item.acceptable.map((entry) => entry.trim()).filter(Boolean).slice(0, 4),
      explanation,
      topic,
    };
  }
  const options = item.options.map((option) => option.trim()).filter(Boolean).slice(0, 4);
  if (options.length < 3) return null;
  const answer = matchOption(options, item.answer);
  if (!answer) return null;
  return { questionId: `q${number}`, type: "mcq", prompt, options, answer, acceptable: [], explanation, topic };
}

export function normalizeQuiz(data: unknown, format: QuizFormat, count: number): { title: string; questions: AnswerKeyItem[] } {
  const parsed = quizSchema.parse(data);
  const questions: AnswerKeyItem[] = [];
  for (const item of parsed.questions) {
    const type: QuestionType =
      format === "mixed" || format === "exam"
        ? item.type
        : format === "true_false"
          ? "true_false"
          : format === "short_answer"
            ? "short_answer"
            : "mcq";
    const built = buildQuestion(item, type, questions.length + 1);
    if (!built) continue;
    questions.push(built);
    if (questions.length === count) break;
  }
  if (questions.length === 0) throw new Error("No usable questions were produced.");
  return { title: parsed.title, questions };
}

export function isCorrect(question: AnswerKeyItem, given: string): boolean {
  if (question.type === "mcq") return normalizeAnswer(given) === normalizeAnswer(question.answer);
  if (question.type === "true_false") {
    const mapped = asTrueFalse(given);
    return mapped === question.answer;
  }
  return answersMatch(given, question.answer, question.acceptable);
}

export function displayAnswer(question: AnswerKeyItem): string {
  if (question.type === "true_false") return question.answer === "true" ? "True" : "False";
  return question.answer;
}
