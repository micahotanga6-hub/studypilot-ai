import type { Metadata } from "next";
import { NotesScreen } from "@/components/screens/notes-screen";

export const metadata: Metadata = { title: "AI Summaries" };

export default function Page() {
  return <NotesScreen />;
}
