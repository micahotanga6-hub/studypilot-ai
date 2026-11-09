import type { Metadata } from "next";
import { Suspense } from "react";
import { NewQuizScreen } from "@/components/screens/quiz-screens";

export const metadata: Metadata = { title: "New quiz" };

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <NewQuizScreen />
    </Suspense>
  );
}
