"use client";

import { useEffect, useState } from "react";
import { Alert, Card, PageHeader } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { listByUid, listOwned } from "@/lib/client-data";
import { COLLECTIONS } from "@/lib/collections";
import { friendlyFirebaseError } from "@/lib/errors";
import { formatWhen } from "@/lib/format";
import { studyStreak } from "@/lib/text";
import type { FlashcardRecord, QuizAttemptRecord, StudySessionRecord, SummaryRecord } from "@/lib/types";

export function ProgressScreen() {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ notes: 0, learned: 0, cards: 0, attempts: 0, average: 0, streak: 0, recent: [] as QuizAttemptRecord[], topics: [] as string[] });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      listOwned<SummaryRecord>(COLLECTIONS.summaries, user.uid),
      listByUid<FlashcardRecord>(COLLECTIONS.cards, user.uid),
      listOwned<QuizAttemptRecord>(COLLECTIONS.attempts, user.uid),
      listOwned<StudySessionRecord>(COLLECTIONS.sessions, user.uid),
    ]).then(([notes, cards, attempts, sessions]) => {
      const average = attempts.length === 0 ? 0 : Math.round(attempts.reduce((sum, item) => sum + item.percent, 0) / attempts.length);
      const topics = [...new Set(attempts.flatMap((item) => item.topicsToReview || []))].slice(0, 8);
      setStats({
        notes: notes.length,
        learned: cards.filter((card) => card.learned).length,
        cards: cards.length,
        attempts: attempts.length,
        average,
        streak: studyStreak(sessions.map((session) => session.createdAtMs)),
        recent: attempts.slice(0, 5),
        topics,
      });
    }).catch((err) => setError(friendlyFirebaseError(err)));
  }, [user]);

  const cards = [
    ["Notes saved", String(stats.notes)],
    ["Cards learned", stats.cards ? `${stats.learned} / ${stats.cards}` : "0"],
    ["Quiz attempts", String(stats.attempts)],
    ["Average score", stats.attempts ? `${stats.average}%` : "—"],
    ["Day streak", String(stats.streak)],
  ];

  return (
    <>
      <PageHeader title="Progress" lede="These numbers are counted from your saved notes, cards, quizzes, and study sessions. Advanced analytics are not in this version." />
      {error ? <div className="mb-4"><Alert>{error}</Alert></div> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([label, value]) => (
          <Card key={label}><p className="text-xs uppercase tracking-wide text-muted">{label}</p><p className="mt-2 font-display text-3xl">{value}</p></Card>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-display text-2xl">Recent quiz scores</h2>
          {stats.recent.length === 0 ? <p className="mt-3 text-sm text-muted">No quiz attempts yet.</p> : (
            <ul className="mt-3 space-y-2 text-sm">
              {stats.recent.map((attempt) => <li key={attempt.id}>{attempt.quizTitle}: {attempt.score}/{attempt.total} · {formatWhen(attempt.createdAtMs)}</li>)}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="font-display text-2xl">Topics to review</h2>
          {stats.topics.length === 0 ? <p className="mt-3 text-sm text-muted">Missed quiz topics will show up here after an attempt.</p> : (
            <ul className="mt-3 space-y-2 text-sm">{stats.topics.map((topic) => <li key={topic}>{topic}</li>)}</ul>
          )}
        </Card>
      </div>
      {stats.streak === 0 ? <p className="mt-4 text-sm text-muted">A streak appears after study activity on consecutive days. Today it is zero because there is no qualifying activity yet, or a day was missed.</p> : null}
    </>
  );
}
