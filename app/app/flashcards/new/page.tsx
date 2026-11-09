import type { Metadata } from "next";
import { Suspense } from "react";
import { NewDeckScreen } from "@/components/screens/flashcard-screens";

export const metadata: Metadata = { title: "New flashcards" };

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <NewDeckScreen />
    </Suspense>
  );
}
