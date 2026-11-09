import type { Metadata } from "next";
import { DecksScreen } from "@/components/screens/flashcard-screens";

export const metadata: Metadata = { title: "Flashcards" };

export default function Page() {
  return <DecksScreen />;
}
