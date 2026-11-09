"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, Card, Empty, Field, PageHeader, fieldClass } from "@/components/ui";
import { useAccount } from "@/components/use-account";
import { useAuth } from "@/components/auth-provider";
import { authFetch } from "@/lib/api-client";
import { listOwned } from "@/lib/client-data";
import { COLLECTIONS } from "@/lib/collections";
import { friendlyFirebaseError } from "@/lib/errors";
import { formatWhen } from "@/lib/format";
import { QUIZ_DIFFICULTIES, QUIZ_FORMATS } from "@/lib/plans";
import type { QuizAttemptRecord, QuizDifficulty, QuizFormat, QuizQuestionPublic, QuizRecord, StudyDocument } from "@/lib/types";

export function QuizzesScreen() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizRecord[]>([]);
  const [attempts, setAttempts] = useState<QuizAttemptRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    listOwned<QuizRecord>(COLLECTIONS.quizzes, user.uid).then(setQuizzes).catch((err) => setError(friendlyFirebaseError(err)));
    listOwned<QuizAttemptRecord>(COLLECTIONS.attempts, user.uid).then(setAttempts).catch((err) => setError(friendlyFirebaseError(err)));
  }, [user]);
  return (
    <>
      <PageHeader title="Quizzes" lede="Practice questions from your material. They are not official exam papers." action={<Link href="/app/quizzes/new" className="rounded-full bg-pine px-4 py-2.5 text-sm font-medium text-white">New quiz</Link>} />
      {error ? <Alert>{error}</Alert> : null}
      {quizzes.length === 0 ? <Empty title="No quizzes yet" body="Generate one from a document." /> : (
        <ul className="divide-y divide-line rounded-3xl border border-line bg-card">
          {quizzes.map((quiz) => {
            const latest = attempts.find((attempt) => attempt.quizId === quiz.id);
            return (
              <li key={quiz.id} className="px-5 py-4">
                <Link href={`/app/quizzes/${quiz.id}`} className="font-medium underline decoration-line underline-offset-4">{quiz.title}</Link>
                <p className="text-xs text-muted">{quiz.questionCount} questions · {quiz.format} · {quiz.difficulty}{latest ? ` · last score ${latest.score}/${latest.total}` : ""} · {formatWhen(quiz.createdAtMs)}</p>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export function NewQuizScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, limits } = useAccount();
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [documentId, setDocumentId] = useState(params.get("document") || "");
  const [format, setFormat] = useState<QuizFormat>("mcq");
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("easy");
  const [count, setCount] = useState(Math.min(5, limits.questionsPerQuiz));
  const [topic, setTopic] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!user) return;
    listOwned<StudyDocument>(COLLECTIONS.documents, user.uid).then(setDocuments).catch((err) => setError(friendlyFirebaseError(err)));
  }, [user]);

  async function generate() {
    if (!user?.emailVerified) return setError("Verify your email before generating a quiz.");
    if (!documentId) return setError("Choose a document.");
    setWorking(true);
    setError(null);
    try {
      const result = await authFetch<{ id: string }>("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, format, difficulty, count, topic }),
      });
      router.push(`/app/quizzes/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The quiz could not be generated.");
      setWorking(false);
    }
  }

  return (
    <>
      <PageHeader title="New quiz" lede={`Up to ${limits.questionsPerQuiz} questions on the ${limits.label} plan. Short answers are marked against the expected answer.`} />
      {error ? <div className="mb-4"><Alert>{error}</Alert></div> : null}
      <div className="max-w-xl space-y-4">
        <Field label="Document">
          <select className={fieldClass} value={documentId} onChange={(event) => setDocumentId(event.target.value)}>
            <option value="">Choose a document</option>
            {documents.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </Field>
        <Field label="Format">
          <select className={fieldClass} value={format} onChange={(event) => setFormat(event.target.value as QuizFormat)}>
            {QUIZ_FORMATS.map((item) => <option key={item.id} value={item.id} disabled={!limits.quizFormats.includes(item.id)}>{item.label}{limits.quizFormats.includes(item.id) ? "" : " (Pro)"}</option>)}
          </select>
        </Field>
        <Field label="Difficulty">
          <select className={fieldClass} value={difficulty} onChange={(event) => setDifficulty(event.target.value as QuizDifficulty)}>
            {QUIZ_DIFFICULTIES.map((item) => <option key={item.id} value={item.id} disabled={!limits.difficulties.includes(item.id)}>{item.label}{limits.difficulties.includes(item.id) ? "" : " (Student)"}</option>)}
          </select>
        </Field>
        <Field label="Number of questions"><input type="number" min={1} max={limits.questionsPerQuiz} value={count} onChange={(event) => setCount(Number(event.target.value))} className={fieldClass} /></Field>
        <Field label="Topic" hint="Optional. If the document does not cover it, the quiz stays with what is actually there."><input value={topic} onChange={(event) => setTopic(event.target.value)} maxLength={80} className={fieldClass} /></Field>
        <Button disabled={working} onClick={generate}>{working ? "Writing questions…" : "Generate quiz"}</Button>
      </div>
    </>
  );
}

interface ReviewItem {
  questionId: string;
  prompt: string;
  yourAnswer: string;
  correctAnswer: string;
  correct: boolean;
  explanation: string;
  topic: string;
}

interface QuizPayload {
  title: string;
  questions: QuizQuestionPublic[];
  sourceCharsUsed: number;
  sourceCharsTotal: number;
}

export function QuizScreen({ id }: { id: string }) {
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<QuizPayload | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; total: number; percent: number; topicsToReview: string[]; review: ReviewItem[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!user) return;
    authFetch<QuizPayload>(`/api/quizzes/${id}`).then(setQuiz).catch((err) => setError(err instanceof Error ? err.message : "Could not load the quiz."));
  }, [user, id]);

  const question = quiz?.questions[index];

  async function submit() {
    if (!quiz) return;
    setWorking(true);
    setError(null);
    try {
      const response = await authFetch<{ score: number; total: number; percent: number; topicsToReview: string[]; review: ReviewItem[] }>(`/api/quizzes/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: quiz.questions.map((item) => ({ questionId: item.id, value: answers[item.id] || "" })) }),
      });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The quiz could not be marked.");
    } finally {
      setWorking(false);
    }
  }

  if (error && !quiz) return <Alert>{error}</Alert>;
  if (!quiz) return <p className="text-sm text-muted">Loading quiz…</p>;

  if (result) {
    const missed = result.review.filter((item) => !item.correct);
    return (
      <>
        <PageHeader title={quiz.title} lede="This attempt is saved. The questions were practice, not an official exam." />
        <Card>
          <p className="font-display text-5xl">{result.score}/{result.total}</p>
          <p className="mt-2 text-sm text-muted">{result.percent}% correct.</p>
          {result.topicsToReview.length > 0 ? <p className="mt-3 text-sm">Review: {result.topicsToReview.join(", ")}.</p> : <p className="mt-3 text-sm">You answered every question correctly.</p>}
        </Card>
        <div className="mt-4 space-y-3">
          {missed.map((item) => (
            <Card key={item.questionId}>
              <p className="font-medium">{item.prompt}</p>
              <p className="mt-2 text-sm">Your answer: {item.yourAnswer || "Blank"}</p>
              <p className="text-sm">Correct answer: {item.correctAnswer}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{item.explanation}</p>
            </Card>
          ))}
        </div>
        <Button className="mt-4" variant="secondary" onClick={() => { setResult(null); setAnswers({}); setIndex(0); }}>Retake</Button>
      </>
    );
  }

  return (
    <>
      <PageHeader title={quiz.title} lede={`Question ${index + 1} of ${quiz.questions.length}. Answers stay hidden until you submit.`} />
      {quiz.sourceCharsUsed < quiz.sourceCharsTotal ? <div className="mb-4"><Alert tone="info">Questions use the first {quiz.sourceCharsUsed.toLocaleString()} of {quiz.sourceCharsTotal.toLocaleString()} characters.</Alert></div> : null}
      {error ? <div className="mb-4"><Alert>{error}</Alert></div> : null}
      {question ? (
        <Card>
          <p className="font-display text-2xl">{question.prompt}</p>
          {question.type === "short_answer" ? (
            <textarea className={`${fieldClass} mt-4`} rows={4} value={answers[question.id] || ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} />
          ) : (
            <div className="mt-4 space-y-2">
              {(question.options || []).map((option) => (
                <label key={option} className="flex items-start gap-2 rounded-2xl border border-line px-3 py-3 text-sm">
                  <input type="radio" name={question.id} checked={answers[question.id] === option} onChange={() => setAnswers((current) => ({ ...current, [question.id]: option }))} />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          )}
        </Card>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}>Previous</Button>
        {index < quiz.questions.length - 1 ? <Button onClick={() => setIndex((value) => value + 1)}>Next</Button> : <Button disabled={working} onClick={submit}>{working ? "Marking…" : "Submit quiz"}</Button>}
      </div>
    </>
  );
}
