import type { Metadata } from "next";
import { QuizScreen } from "@/components/screens/quiz-screens";

export const metadata: Metadata = { title: "Quiz" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <QuizScreen id={id} />;
}
