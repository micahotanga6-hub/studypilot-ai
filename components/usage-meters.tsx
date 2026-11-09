import type { PlanLimits } from "@/lib/plans";
import type { UsageCounts } from "@/lib/types";

export function UsageMeters({ usage, limits }: { usage: UsageCounts; limits: PlanLimits }) {
  const rows = [
    ["Uploads", usage.uploads, limits.uploads],
    ["Notes", usage.notes, limits.notes],
    ["Flashcard decks", usage.decks, limits.decks],
    ["Quizzes", usage.quizzes, limits.quizzes],
  ] as const;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {rows.map(([label, used, max]) => (
        <div key={label}>
          <div className="flex justify-between text-sm">
            <span>{label}</span>
            <span className="text-muted">{used} / {max} this month</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-paper-deep">
            <div className="h-2 rounded-full bg-pine" style={{ width: `${max === 0 ? 0 : Math.min(100, (used / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
