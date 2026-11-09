import type { Metadata } from "next";
import { Suspense } from "react";
import { NewNoteScreen } from "@/components/screens/new-note-screen";

export const metadata: Metadata = { title: "New notes" };

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <NewNoteScreen />
    </Suspense>
  );
}
