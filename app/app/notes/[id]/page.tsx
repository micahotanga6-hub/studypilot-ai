import type { Metadata } from "next";
import { NoteScreen } from "@/components/screens/note-screen";

export const metadata: Metadata = { title: "Notes" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <NoteScreen id={id} />;
}
