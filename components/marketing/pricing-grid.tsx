import Link from "next/link";
import { PLAN_LIST, formatBytes } from "@/lib/plans";

export function PricingGrid() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {PLAN_LIST.map((plan) => {
        const recommended = plan.id === "student";
        return (
          <article key={plan.id} className={`flex flex-col rounded-3xl border bg-card p-6 ${recommended ? "border-pine shadow-[0_18px_40px_rgba(28,107,86,0.08)]" : "border-line"}`}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-2xl">{plan.label}</h3>
              {recommended ? <span className="rounded-full bg-pine px-2.5 py-1 text-xs font-medium text-white">Recommended</span> : null}
            </div>
            <p className="mt-3 font-display text-4xl">{plan.price}<span className="text-base text-muted">/month</span></p>
            <p className="mt-3 text-sm leading-6 text-muted">{plan.blurb}</p>
            <ul className="mt-5 flex-1 space-y-2 text-sm leading-6">
              <li>{plan.uploads} uploads, up to {formatBytes(plan.maxUploadBytes)} each</li>
              <li>{plan.notes} notes and {plan.decks} flashcard decks</li>
              <li>{plan.quizzes} quizzes, up to {plan.questionsPerQuiz} questions</li>
              <li>{plan.aiTutor ? "AI tutor and AI study plans" : "Manual study planner"}</li>
              <li>{plan.advancedExplanations ? "Exam-style practice and longer explanations" : "Practice quizzes from your material"}</li>
            </ul>
            <Link href="/signup" className={`mt-6 rounded-full px-4 py-2.5 text-center text-sm font-medium ${recommended ? "bg-pine text-white" : "border border-line"}`}>
              {plan.id === "free" ? "Create a free account" : "See this plan in the app"}
            </Link>
          </article>
        );
      })}
    </div>
  );
}
