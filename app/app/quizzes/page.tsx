import type { Metadata } from "next";
import { QuizzesScreen } from "@/components/screens/quiz-screens";

export const metadata: Metadata = { title: "Quizzes" };

export default function Page() {
  return <QuizzesScreen />;
}
