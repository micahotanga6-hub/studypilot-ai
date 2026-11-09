import type { Metadata } from "next";
import { DeckScreen } from "@/components/screens/flashcard-screens";

export const metadata: Metadata = { title: "Flashcard deck" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DeckScreen id={id} />;
}
